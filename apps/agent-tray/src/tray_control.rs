#[cfg(unix)]
use std::fs;
use std::{
    hash::{DefaultHasher, Hash, Hasher},
    io::{BufRead, BufReader, Read, Write},
    path::{Path, PathBuf},
    sync::mpsc::Sender,
    sync::{
        Arc, RwLock,
        atomic::{AtomicBool, Ordering},
    },
    thread::{self, JoinHandle},
    time::Duration,
};

use interprocess::local_socket::{
    GenericFilePath, ListenerNonblockingMode, ListenerOptions, Stream as LocalSocketStream,
    prelude::*,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
#[cfg(windows)]
use sysinfo::{Pid, ProcessesToUpdate, System};
use thiserror::Error;

use crate::{
    TRAY_CONTROL_PROTOCOL_VERSION,
    instance::TrayInstanceRecord,
    model::{TraySnapshot, TrayState},
    self_use_config::{
        OriginValidationOptions, SelfUseCandidate, SelfUseConfigError, SelfUseSetupState,
        apply_candidate, get_setup_state, normalize_config, read_config, restore_known_good,
        validate_candidate,
    },
};

const MAX_MESSAGE_BYTES: u64 = 96 * 1024;

pub type CandidateVerifier = Arc<
    dyn Fn(&Path, &SelfUseCandidate, OriginValidationOptions) -> Result<(), String> + Send + Sync,
>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TrayCommand {
    Open,
    OpenSettings,
    ConfigurationApplied,
    SwitchEnvironment(String),
    Shutdown,
}

#[derive(Clone, Debug, Default)]
pub struct SetupRequestPayload {
    pub deployment_origin: Option<String>,
    pub device_name: Option<String>,
    pub connection_enabled: Option<bool>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct TrayControlRequest {
    protocol_version: u32,
    instance_nonce: String,
    operation: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    environment_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    deployment_origin: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    device_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    connection_enabled: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct TrayControlEnvelope {
    ok: bool,
    protocol_version: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<TrayControlFailure>,
}

#[derive(Debug, Deserialize, Serialize)]
struct TrayControlFailure {
    code: String,
    message: String,
}

#[derive(Debug, Error)]
pub enum TrayControlError {
    #[error("tray control request was rejected: {0}")]
    Rejected(String),
    #[error("tray control response is invalid")]
    InvalidResponse,
    #[error("tray control server thread failed")]
    ThreadFailed,
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

pub struct TrayControlServer {
    stop: Arc<AtomicBool>,
    record: TrayInstanceRecord,
    thread: Option<JoinHandle<()>>,
}

impl TrayControlServer {
    pub fn start(
        record: TrayInstanceRecord,
        snapshot: Arc<RwLock<TraySnapshot>>,
        commands: Sender<TrayCommand>,
        user_data_dir: PathBuf,
    ) -> Result<Self, TrayControlError> {
        Self::start_with_candidate_verifier(
            record,
            snapshot,
            commands,
            user_data_dir,
            Arc::new(|_, _, _| Ok(())),
        )
    }

    pub fn start_with_candidate_verifier(
        record: TrayInstanceRecord,
        snapshot: Arc<RwLock<TraySnapshot>>,
        commands: Sender<TrayCommand>,
        user_data_dir: PathBuf,
        candidate_verifier: CandidateVerifier,
    ) -> Result<Self, TrayControlError> {
        let endpoint = record.control_endpoint.clone();
        let name = Path::new(&endpoint).to_fs_name::<GenericFilePath>()?;
        let listener = ListenerOptions::new()
            .name(name)
            .reclaim_name(true)
            .create_sync()?;
        listener.set_nonblocking(ListenerNonblockingMode::Accept)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&endpoint, fs::Permissions::from_mode(0o600))?;
        }
        let stop = Arc::new(AtomicBool::new(false));
        let thread_stop = Arc::clone(&stop);
        let thread_record = record.clone();
        let thread = thread::Builder::new()
            .name("cthutool-tray-control".into())
            .spawn(move || {
                while !thread_stop.load(Ordering::Acquire) {
                    match listener.accept() {
                        Ok(stream) => {
                            let _ = handle_connection(
                                stream,
                                &thread_record,
                                &snapshot,
                                &commands,
                                &user_data_dir,
                                &candidate_verifier,
                            );
                        }
                        Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                            thread::sleep(Duration::from_millis(20));
                        }
                        Err(_) => break,
                    }
                }
            })?;
        Ok(Self {
            stop,
            record,
            thread: Some(thread),
        })
    }

    pub fn stop(mut self) -> Result<(), TrayControlError> {
        self.stop.store(true, Ordering::Release);
        // Wake a blocking implementation, while keeping the same authenticated path.
        let _ = TrayControlClient::new(self.record.clone()).health();
        if self
            .thread
            .take()
            .is_some_and(|thread| thread.join().is_err())
        {
            return Err(TrayControlError::ThreadFailed);
        }
        Ok(())
    }
}

fn handle_connection(
    stream: LocalSocketStream,
    record: &TrayInstanceRecord,
    snapshot: &RwLock<TraySnapshot>,
    commands: &Sender<TrayCommand>,
    user_data_dir: &Path,
    candidate_verifier: &CandidateVerifier,
) -> Result<(), TrayControlError> {
    if !same_user_peer(&stream, record) {
        write_envelope(
            stream,
            failure("UNAUTHORIZED_USER", "Tray control is user-scoped"),
        )?;
        return Ok(());
    }
    stream.set_recv_timeout(Some(Duration::from_secs(2)))?;
    stream.set_send_timeout(Some(Duration::from_secs(2)))?;
    let mut reader = BufReader::new(stream);
    let mut raw = String::new();
    reader
        .by_ref()
        .take(MAX_MESSAGE_BYTES + 1)
        .read_line(&mut raw)?;
    if raw.len() as u64 > MAX_MESSAGE_BYTES {
        write_envelope(
            reader.into_inner(),
            failure("INVALID_REQUEST", "Tray control request is too large"),
        )?;
        return Ok(());
    }
    let Ok(request) = serde_json::from_str::<TrayControlRequest>(raw.trim_end()) else {
        write_envelope(
            reader.into_inner(),
            failure("INVALID_REQUEST", "Tray control request is invalid"),
        )?;
        return Ok(());
    };
    if request.protocol_version != TRAY_CONTROL_PROTOCOL_VERSION {
        write_envelope(
            reader.into_inner(),
            failure(
                "INCOMPATIBLE_PROTOCOL",
                "Tray control protocol is incompatible",
            ),
        )?;
        return Ok(());
    }
    if request.instance_nonce != record.nonce {
        write_envelope(
            reader.into_inner(),
            failure("UNAUTHORIZED_INSTANCE", "Tray instance identity is invalid"),
        )?;
        return Ok(());
    }
    let options = OriginValidationOptions::from_env();
    let response = match request.operation.as_str() {
        "health" | "status" => {
            let value = snapshot
                .read()
                .map_or_else(|_| TraySnapshot::default(), |value| value.clone());
            success(serde_json::to_value(value)?)
        }
        "open" => queue(commands, TrayCommand::Open),
        "settings.open" => queue(commands, TrayCommand::OpenSettings),
        "shutdown" => queue(commands, TrayCommand::Shutdown),
        "environment.switch" => request.environment_id.map_or_else(
            || failure("INVALID_ENVIRONMENT", "Environment id is required"),
            |environment_id| queue(commands, TrayCommand::SwitchEnvironment(environment_id)),
        ),
        "setup.get" => match get_setup_state(user_data_dir, options) {
            Ok(state) => {
                sync_setup_fields(snapshot, &state);
                success(serde_json::to_value(state)?)
            }
            Err(error) => setup_failure(&error),
        },
        "setup.validate" => {
            let candidate = candidate_from_request(&request);
            if candidate.deployment_origin.is_empty() {
                failure("INVALID_ORIGIN", "deploymentOrigin is required")
            } else {
                match validate_candidate(&candidate, options) {
                    Ok(endpoints) => match candidate_verifier(user_data_dir, &candidate, options) {
                        Ok(()) => success(serde_json::to_value(endpoints)?),
                        Err(message) => failure("BACKEND_VERIFICATION_FAILED", &message),
                    },
                    Err(error) => setup_failure(&error),
                }
            }
        }
        "setup.apply" => {
            let candidate = candidate_from_request(&request);
            if candidate.deployment_origin.is_empty() {
                failure("INVALID_ORIGIN", "deploymentOrigin is required")
            } else {
                let previous_config = match read_config(user_data_dir, options).ok().flatten() {
                    Some(config) => config,
                    None => match normalize_config(None, options) {
                        Ok(config) => config,
                        Err(error) => {
                            return write_envelope(reader.into_inner(), setup_failure(&error));
                        }
                    },
                };
                let verification = validate_candidate(&candidate, options).and_then(|_| {
                    candidate_verifier(user_data_dir, &candidate, options)
                        .map_err(SelfUseConfigError::BackendVerification)
                });
                match verification.and_then(|_| apply_candidate(user_data_dir, &candidate, options))
                {
                    Ok((_config, _endpoints)) => match get_setup_state(user_data_dir, options) {
                        Ok(state) => {
                            sync_setup_fields(snapshot, &state);
                            if commands.send(TrayCommand::ConfigurationApplied).is_err() {
                                restore_known_good(user_data_dir, &previous_config, options);
                                failure("TRAY_STOPPING", "Tray is stopping")
                            } else {
                                success(serde_json::to_value(state)?)
                            }
                        }
                        Err(error) => {
                            restore_known_good(user_data_dir, &previous_config, options);
                            setup_failure(&error)
                        }
                    },
                    Err(error) => setup_failure(&error),
                }
            }
        }
        _ => failure("UNKNOWN_OPERATION", "Tray control operation is unsupported"),
    };
    write_envelope(reader.into_inner(), response)
}

fn candidate_from_request(request: &TrayControlRequest) -> SelfUseCandidate {
    SelfUseCandidate {
        deployment_origin: request.deployment_origin.clone().unwrap_or_default(),
        device_name: request.device_name.clone(),
        connection_enabled: request.connection_enabled,
    }
}

fn sync_setup_fields(snapshot: &RwLock<TraySnapshot>, state: &SelfUseSetupState) {
    if let Ok(mut snapshot) = snapshot.write() {
        snapshot.setup_required = state.setup_required;
        snapshot.deployment_origin = state.deployment_origin.clone();
        if state.setup_required && snapshot.state != TrayState::Stopping {
            snapshot.state = TrayState::SetupRequired;
        }
    }
}

fn setup_failure(error: &SelfUseConfigError) -> TrayControlEnvelope {
    failure(error.code(), &error.to_string())
}

fn queue(commands: &Sender<TrayCommand>, command: TrayCommand) -> TrayControlEnvelope {
    commands.send(command).map_or_else(
        |_| failure("TRAY_STOPPING", "Tray is stopping"),
        |()| success(serde_json::json!({ "accepted": true })),
    )
}

fn write_envelope(
    mut stream: LocalSocketStream,
    response: TrayControlEnvelope,
) -> Result<(), TrayControlError> {
    serde_json::to_writer(&mut stream, &response)?;
    stream.write_all(b"\n")?;
    stream.flush()?;
    Ok(())
}

fn success(result: Value) -> TrayControlEnvelope {
    TrayControlEnvelope {
        ok: true,
        protocol_version: TRAY_CONTROL_PROTOCOL_VERSION,
        result: Some(result),
        error: None,
    }
}

fn failure(code: &str, message: &str) -> TrayControlEnvelope {
    TrayControlEnvelope {
        ok: false,
        protocol_version: TRAY_CONTROL_PROTOCOL_VERSION,
        result: None,
        error: Some(TrayControlFailure {
            code: code.into(),
            message: message.into(),
        }),
    }
}

#[cfg(unix)]
fn same_user_peer(stream: &LocalSocketStream, record: &TrayInstanceRecord) -> bool {
    use std::os::unix::fs::MetadataExt;
    let peer_user = stream
        .peer_creds()
        .ok()
        .and_then(|credentials| credentials.euid());
    let current_user = fs::metadata(&record.control_endpoint)
        .ok()
        .map(|metadata| metadata.uid());
    peer_user.is_some() && peer_user == current_user
}

#[cfg(windows)]
fn same_user_peer(stream: &LocalSocketStream, record: &TrayInstanceRecord) -> bool {
    let Some(peer_pid) = stream
        .peer_creds()
        .ok()
        .and_then(|credentials| credentials.pid())
    else {
        return false;
    };
    let mut system = System::new();
    let peer = Pid::from_u32(peer_pid);
    let server = Pid::from_u32(record.pid);
    system.refresh_processes(ProcessesToUpdate::Some(&[peer, server]), true);
    match (system.process(peer), system.process(server)) {
        (Some(peer), Some(server)) => {
            peer.user_id().is_some() && peer.user_id() == server.user_id()
        }
        _ => false,
    }
}

#[cfg(not(any(unix, windows)))]
fn same_user_peer(_stream: &LocalSocketStream, _record: &TrayInstanceRecord) -> bool {
    false
}

#[derive(Clone, Debug)]
pub struct TrayControlClient {
    record: TrayInstanceRecord,
}

impl TrayControlClient {
    #[must_use]
    pub fn new(record: TrayInstanceRecord) -> Self {
        Self { record }
    }

    pub fn health(&self) -> Result<TraySnapshot, TrayControlError> {
        let value = self.request("health", None, None)?;
        serde_json::from_value(value).map_err(TrayControlError::Json)
    }

    pub fn open(&self) -> Result<(), TrayControlError> {
        self.request("open", None, None).map(|_| ())
    }

    pub fn settings_open(&self) -> Result<(), TrayControlError> {
        self.request("settings.open", None, None).map(|_| ())
    }

    pub fn setup_get(&self) -> Result<SelfUseSetupState, TrayControlError> {
        let value = self.request("setup.get", None, None)?;
        serde_json::from_value(value).map_err(TrayControlError::Json)
    }

    pub fn setup_validate(&self, payload: &SetupRequestPayload) -> Result<Value, TrayControlError> {
        self.request("setup.validate", None, Some(payload))
    }

    pub fn setup_apply(
        &self,
        payload: &SetupRequestPayload,
    ) -> Result<SelfUseSetupState, TrayControlError> {
        let value = self.request("setup.apply", None, Some(payload))?;
        serde_json::from_value(value).map_err(TrayControlError::Json)
    }

    pub fn switch_environment(&self, environment_id: &str) -> Result<(), TrayControlError> {
        self.request("environment.switch", Some(environment_id), None)
            .map(|_| ())
    }

    pub fn shutdown(&self) -> Result<(), TrayControlError> {
        self.request("shutdown", None, None).map(|_| ())
    }

    fn request(
        &self,
        operation: &str,
        environment_id: Option<&str>,
        setup: Option<&SetupRequestPayload>,
    ) -> Result<Value, TrayControlError> {
        let name = Path::new(&self.record.control_endpoint).to_fs_name::<GenericFilePath>()?;
        let stream = LocalSocketStream::connect(name)?;
        stream.set_recv_timeout(Some(Duration::from_secs(2)))?;
        stream.set_send_timeout(Some(Duration::from_secs(2)))?;
        let mut reader = BufReader::new(stream);
        let request = TrayControlRequest {
            protocol_version: TRAY_CONTROL_PROTOCOL_VERSION,
            instance_nonce: self.record.nonce.clone(),
            operation: operation.into(),
            environment_id: environment_id.map(str::to_owned),
            deployment_origin: setup.and_then(|value| value.deployment_origin.clone()),
            device_name: setup.and_then(|value| value.device_name.clone()),
            connection_enabled: setup.and_then(|value| value.connection_enabled),
        };
        serde_json::to_writer(reader.get_mut(), &request)?;
        reader.get_mut().write_all(b"\n")?;
        reader.get_mut().flush()?;
        let mut raw = String::new();
        reader
            .by_ref()
            .take(MAX_MESSAGE_BYTES + 1)
            .read_line(&mut raw)?;
        if raw.len() as u64 > MAX_MESSAGE_BYTES {
            return Err(TrayControlError::InvalidResponse);
        }
        let response: TrayControlEnvelope = serde_json::from_str(raw.trim_end())?;
        if response.protocol_version != TRAY_CONTROL_PROTOCOL_VERSION {
            return Err(TrayControlError::InvalidResponse);
        }
        if !response.ok {
            return Err(TrayControlError::Rejected(response.error.map_or_else(
                || "unknown control error".into(),
                |error| format!("{}: {}", error.code, error.message),
            )));
        }
        response.result.ok_or(TrayControlError::InvalidResponse)
    }
}

#[must_use]
pub fn resolve_tray_control_endpoint(data_dir: &Path) -> String {
    if cfg!(windows) {
        let mut hasher = DefaultHasher::new();
        data_dir.hash(&mut hasher);
        format!("\\\\.\\pipe\\cthutool-agent-tray-{:016x}", hasher.finish())
    } else {
        let preferred = data_dir.join("runtime").join("tray.sock");
        if preferred.as_os_str().len() <= 90 {
            preferred.to_string_lossy().into_owned()
        } else {
            let mut hasher = DefaultHasher::new();
            data_dir.hash(&mut hasher);
            std::env::temp_dir()
                .join(format!("cthutool-tray-{:016x}.sock", hasher.finish()))
                .to_string_lossy()
                .into_owned()
        }
    }
}

#[must_use]
pub fn instance_record_path(data_dir: &Path) -> PathBuf {
    data_dir.join("runtime").join("tray-instance.json")
}

#[must_use]
pub fn stopping_snapshot(snapshot: &TraySnapshot) -> TraySnapshot {
    TraySnapshot {
        state: TrayState::Stopping,
        ..snapshot.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::{
        CandidateVerifier, SetupRequestPayload, TrayCommand, TrayControlClient, TrayControlServer,
        instance_record_path, resolve_tray_control_endpoint,
    };
    use crate::{
        TRAY_CONTROL_PROTOCOL_VERSION,
        instance::TrayInstanceRecord,
        model::{TraySnapshot, TrayState},
        self_use_config::{OriginValidationOptions, SelfUseCandidate, apply_candidate},
    };
    use std::{
        fs,
        path::PathBuf,
        sync::{Arc, RwLock, mpsc},
        time::Duration,
    };
    use uuid::Uuid;

    fn fixture() -> (PathBuf, TrayInstanceRecord) {
        let root =
            std::env::temp_dir().join(format!("cta-{}", &Uuid::new_v4().simple().to_string()[..8]));
        fs::create_dir_all(root.join("runtime")).expect("runtime dir");
        let record = TrayInstanceRecord {
            protocol_version: TRAY_CONTROL_PROTOCOL_VERSION,
            pid: std::process::id(),
            nonce: Uuid::new_v4().to_string(),
            control_endpoint: resolve_tray_control_endpoint(&root),
            executable_path: std::env::current_exe().expect("current exe"),
            process_started_at: 1,
        };
        (root, record)
    }

    #[test]
    fn same_user_authenticated_control_opens_authoritative_instance() {
        let (root, record) = fixture();
        let (sender, receiver) = mpsc::channel();
        let snapshot = Arc::new(RwLock::new(TraySnapshot {
            state: TrayState::Ready,
            ..TraySnapshot::default()
        }));
        let server = TrayControlServer::start(record.clone(), snapshot, sender, root.clone())
            .expect("start control server");

        let client = TrayControlClient::new(record);
        assert_eq!(client.health().expect("health").state, TrayState::Ready);
        client.open().expect("open request");
        assert_eq!(
            receiver
                .recv_timeout(Duration::from_secs(1))
                .expect("queued command"),
            TrayCommand::Open
        );

        let endpoint = client.record.control_endpoint.clone();
        server.stop().expect("stop control server");
        if !cfg!(windows) {
            assert!(!PathBuf::from(endpoint).exists());
        }
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn invalid_nonce_cannot_control_tray() {
        let (root, record) = fixture();
        let (sender, _receiver) = mpsc::channel();
        let server = TrayControlServer::start(
            record.clone(),
            Arc::new(RwLock::new(TraySnapshot::default())),
            sender,
            root.clone(),
        )
        .expect("start control server");
        let mut invalid = record;
        invalid.nonce = "wrong-nonce".into();

        assert!(TrayControlClient::new(invalid).open().is_err());

        server.stop().expect("stop control server");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn authorized_setup_get_returns_redacted_state() {
        let (root, record) = fixture();
        let (sender, _receiver) = mpsc::channel();
        let server = TrayControlServer::start(
            record.clone(),
            Arc::new(RwLock::new(TraySnapshot::default())),
            sender,
            root.clone(),
        )
        .expect("start control server");
        let client = TrayControlClient::new(record);
        let state = client.setup_get().expect("setup.get");
        assert!(state.setup_required);
        assert!(!state.configured);
        let serialized = serde_json::to_string(&state).expect("serialize");
        assert!(!serialized.contains("agentSecret"));
        assert!(!serialized.to_lowercase().contains("secret\":"));
        server.stop().expect("stop");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn unauthorized_setup_is_rejected() {
        let (root, record) = fixture();
        let (sender, _receiver) = mpsc::channel();
        let server = TrayControlServer::start(
            record.clone(),
            Arc::new(RwLock::new(TraySnapshot::default())),
            sender,
            root.clone(),
        )
        .expect("start control server");
        let mut invalid = record;
        invalid.nonce = "wrong-nonce".into();
        assert!(TrayControlClient::new(invalid).setup_get().is_err());
        server.stop().expect("stop");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn setup_apply_queues_configuration_applied_command() {
        let (root, record) = fixture();
        let (sender, receiver) = mpsc::channel();
        let server = TrayControlServer::start(
            record.clone(),
            Arc::new(RwLock::new(TraySnapshot::default())),
            sender,
            root.clone(),
        )
        .expect("start control server");
        let client = TrayControlClient::new(record);
        let state = client
            .setup_apply(&SetupRequestPayload {
                deployment_origin: Some("https://app.example.com".into()),
                device_name: Some("Desk".into()),
                connection_enabled: Some(true),
            })
            .expect("setup.apply");
        assert!(state.configured);
        assert!(!state.setup_required);
        assert_eq!(
            receiver
                .recv_timeout(Duration::from_secs(1))
                .expect("queued command"),
            TrayCommand::ConfigurationApplied
        );
        let health = serde_json::to_string(&client.health().expect("health")).expect("json");
        assert!(!health.contains("good-secret-value"));
        assert!(!health.contains("agentSecret"));
        server.stop().expect("stop");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn setup_apply_rolls_back_when_restart_cannot_be_scheduled() {
        let (root, record) = fixture();
        apply_candidate(
            &root,
            &SelfUseCandidate {
                deployment_origin: "https://good.example.com".into(),
                device_name: Some("Good".into()),
                connection_enabled: Some(true),
            },
            OriginValidationOptions::default(),
        )
        .expect("initial config");
        let (sender, receiver) = mpsc::channel();
        drop(receiver);
        let server = TrayControlServer::start(
            record.clone(),
            Arc::new(RwLock::new(TraySnapshot::default())),
            sender,
            root.clone(),
        )
        .expect("start control server");

        let error = TrayControlClient::new(record)
            .setup_apply(&SetupRequestPayload {
                deployment_origin: Some("https://new.example.com".into()),
                device_name: Some("New".into()),
                connection_enabled: Some(true),
            })
            .expect_err("restart scheduling must fail");
        assert!(error.to_string().contains("TRAY_STOPPING"));
        assert_eq!(
            super::super::self_use_config::read_config(&root, OriginValidationOptions::default(),)
                .expect("read config")
                .expect("config")
                .deployment_origin
                .as_deref(),
            Some("https://good.example.com")
        );
        server.stop().expect("stop");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn setup_apply_does_not_persist_when_candidate_backend_verification_fails() {
        let (root, record) = fixture();
        apply_candidate(
            &root,
            &SelfUseCandidate {
                deployment_origin: "https://good.example.com".into(),
                device_name: Some("Good".into()),
                connection_enabled: Some(true),
            },
            OriginValidationOptions::default(),
        )
        .expect("initial config");
        let (sender, _receiver) = mpsc::channel();
        let verifier: CandidateVerifier =
            Arc::new(|_, _, _| Err("Backend rejected the candidate credentials".into()));
        let server = TrayControlServer::start_with_candidate_verifier(
            record.clone(),
            Arc::new(RwLock::new(TraySnapshot::default())),
            sender,
            root.clone(),
            verifier,
        )
        .expect("start control server");

        let error = TrayControlClient::new(record)
            .setup_apply(&SetupRequestPayload {
                deployment_origin: Some("https://new.example.com".into()),
                device_name: Some("New".into()),
                connection_enabled: Some(true),
            })
            .expect_err("candidate verification must fail");
        assert!(error.to_string().contains("BACKEND_VERIFICATION_FAILED"));
        assert_eq!(
            super::super::self_use_config::read_config(&root, OriginValidationOptions::default(),)
                .expect("read config")
                .expect("config")
                .deployment_origin
                .as_deref(),
            Some("https://good.example.com")
        );
        server.stop().expect("stop");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn paths_are_scoped_under_the_selected_user_data_root() {
        let root = PathBuf::from("/tmp/a-user/cthutool");
        assert!(instance_record_path(&root).starts_with(&root));
        if !cfg!(windows) {
            assert!(resolve_tray_control_endpoint(&root).starts_with("/tmp/a-user/cthutool"));
        }
    }
}
