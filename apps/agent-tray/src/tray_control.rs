use std::{
    fs,
    hash::{DefaultHasher, Hash, Hasher},
    io::{BufRead, BufReader, Read, Write},
    path::{Path, PathBuf},
    sync::{
        Arc, RwLock,
        atomic::{AtomicBool, Ordering},
        mpsc::Sender,
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
};

const MAX_MESSAGE_BYTES: u64 = 64 * 1024;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TrayCommand {
    Open,
    SwitchEnvironment(String),
    Shutdown,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct TrayControlRequest {
    protocol_version: u32,
    instance_nonce: String,
    operation: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    environment_id: Option<String>,
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
                            let _ = handle_connection(stream, &thread_record, &snapshot, &commands);
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
    let response = match request.operation.as_str() {
        "health" | "status" => {
            let value = snapshot
                .read()
                .map_or_else(|_| TraySnapshot::default(), |value| value.clone());
            success(serde_json::to_value(value)?)
        }
        "open" => queue(commands, TrayCommand::Open),
        "shutdown" => queue(commands, TrayCommand::Shutdown),
        "environment.switch" => request.environment_id.map_or_else(
            || failure("INVALID_ENVIRONMENT", "Environment id is required"),
            |environment_id| queue(commands, TrayCommand::SwitchEnvironment(environment_id)),
        ),
        _ => failure("UNKNOWN_OPERATION", "Tray control operation is unsupported"),
    };
    write_envelope(reader.into_inner(), response)
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
        let value = self.request("health", None)?;
        serde_json::from_value(value).map_err(TrayControlError::Json)
    }

    pub fn open(&self) -> Result<(), TrayControlError> {
        self.request("open", None).map(|_| ())
    }

    pub fn switch_environment(&self, environment_id: &str) -> Result<(), TrayControlError> {
        self.request("environment.switch", Some(environment_id))
            .map(|_| ())
    }

    pub fn shutdown(&self) -> Result<(), TrayControlError> {
        self.request("shutdown", None).map(|_| ())
    }

    fn request(
        &self,
        operation: &str,
        environment_id: Option<&str>,
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
        TrayCommand, TrayControlClient, TrayControlServer, instance_record_path,
        resolve_tray_control_endpoint,
    };
    use crate::{
        TRAY_CONTROL_PROTOCOL_VERSION,
        instance::TrayInstanceRecord,
        model::{TraySnapshot, TrayState},
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
        let server = TrayControlServer::start(record.clone(), snapshot, sender)
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
        )
        .expect("start control server");
        let mut invalid = record;
        invalid.nonce = "wrong-nonce".into();

        assert!(TrayControlClient::new(invalid).open().is_err());

        server.stop().expect("stop control server");
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
