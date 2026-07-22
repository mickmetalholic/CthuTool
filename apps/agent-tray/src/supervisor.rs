use std::{
    fs,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{Arc, RwLock},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use thiserror::Error;

use crate::{
    agent_control::{
        AgentBridgeLaunch, AgentControlClient, AgentControlError, AgentHealth, AgentInstanceRecord,
    },
    instance::{ProcessIdentity, ProcessInspector, SystemProcessInspector},
    launch::{BrowserOpener, LaunchValidationError, validate_launch},
    model::{EnvironmentSummary, TraySnapshot, TrayState},
};

#[derive(Clone, Debug)]
pub struct AgentLaunchConfig {
    pub node_executable: PathBuf,
    pub agent_entry_point: PathBuf,
    pub user_data_dir: PathBuf,
    pub environment_catalog: Option<PathBuf>,
}

impl AgentLaunchConfig {
    #[must_use]
    pub fn instance_path(&self) -> PathBuf {
        self.user_data_dir.join("runtime").join("instance.json")
    }
}

#[derive(Debug, Error)]
pub enum SupervisorError {
    #[error("requested environment does not exist: {0}")]
    InvalidEnvironment(String),
    #[error("Agent child identity does not match the process selected for shutdown")]
    ChildIdentityMismatch,
    #[error("Agent child did not become ready before the timeout")]
    ReadinessTimeout,
    #[error("Agent bridge launch is unavailable: {0}")]
    BridgeUnavailable(String),
    #[error("browser open failed: {0}")]
    BrowserOpen(String),
    #[error(transparent)]
    AgentControl(#[from] AgentControlError),
    #[error(transparent)]
    LaunchValidation(#[from] LaunchValidationError),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

pub trait AgentOperations {
    fn health(&self) -> Result<AgentHealth, AgentControlError>;
    fn environments(&self) -> Result<Vec<EnvironmentSummary>, AgentControlError>;
    fn switch_environment(&self, environment_id: &str) -> Result<(), AgentControlError>;
    fn issue_bridge_launch(&self) -> Result<AgentBridgeLaunch, AgentControlError>;
    fn shutdown(&self) -> Result<(), AgentControlError>;
}

impl AgentOperations for AgentControlClient {
    fn health(&self) -> Result<AgentHealth, AgentControlError> {
        AgentControlClient::health(self)
    }

    fn environments(&self) -> Result<Vec<EnvironmentSummary>, AgentControlError> {
        AgentControlClient::environments(self)
    }

    fn switch_environment(&self, environment_id: &str) -> Result<(), AgentControlError> {
        AgentControlClient::switch_environment(self, environment_id)
    }

    fn issue_bridge_launch(&self) -> Result<AgentBridgeLaunch, AgentControlError> {
        AgentControlClient::issue_bridge_launch(self)
    }

    fn shutdown(&self) -> Result<(), AgentControlError> {
        AgentControlClient::shutdown(self)
    }
}

pub struct TrayInteraction<A, B> {
    agent: A,
    browser: B,
    snapshot: Arc<RwLock<TraySnapshot>>,
}

impl<A: AgentOperations, B: BrowserOpener> TrayInteraction<A, B> {
    #[must_use]
    pub fn new(agent: A, browser: B, snapshot: Arc<RwLock<TraySnapshot>>) -> Self {
        Self {
            agent,
            browser,
            snapshot,
        }
    }

    pub fn refresh(&self) -> Result<(), SupervisorError> {
        let health = self.agent.health()?;
        let environments = self.agent.environments()?;
        let active_environment_id = health.environment.id.clone().or_else(|| {
            environments
                .iter()
                .find(|environment| environment.active)
                .map(|environment| environment.id.clone())
        });
        self.update_snapshot(|snapshot| {
            snapshot.state = state_from_health(&health);
            snapshot.detail = health.backend.last_error.clone();
            snapshot.active_environment_id = active_environment_id;
            snapshot.environments = environments;
        });
        Ok(())
    }

    pub fn open(&self) -> Result<(), SupervisorError> {
        let expected_environment_id = self
            .snapshot
            .read()
            .ok()
            .and_then(|snapshot| snapshot.active_environment_id.clone())
            .ok_or_else(|| SupervisorError::BridgeUnavailable("no environment selected".into()))?;
        // A new call is required for every activation so tickets are never reused.
        let launch = self
            .agent
            .issue_bridge_launch()
            .map_err(|error| SupervisorError::BridgeUnavailable(error.to_string()))?;
        let now_epoch_millis = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .ok()
            .and_then(|duration| u64::try_from(duration.as_millis()).ok());
        let url = validate_launch(&launch, &expected_environment_id, now_epoch_millis)?;
        self.browser
            .open(&url)
            .map_err(SupervisorError::BrowserOpen)
    }

    pub fn switch_environment(&self, environment_id: &str) -> Result<(), SupervisorError> {
        let environments = self.agent.environments()?;
        if !environments
            .iter()
            .any(|environment| environment.id == environment_id)
        {
            return Err(SupervisorError::InvalidEnvironment(environment_id.into()));
        }
        self.update_snapshot(|snapshot| {
            snapshot.state = TrayState::SwitchingEnvironment;
            snapshot.active_environment_id = Some(environment_id.into());
            snapshot.environments = environments
                .iter()
                .cloned()
                .map(|mut environment| {
                    environment.active = environment.id == environment_id;
                    environment
                })
                .collect();
            snapshot.detail = None;
        });
        if let Err(error) = self.agent.switch_environment(environment_id) {
            self.update_snapshot(|snapshot| {
                // The target remains authoritative even when its backend is unavailable.
                snapshot.state = TrayState::BackendOffline;
                snapshot.detail = Some(error.to_string());
            });
            return Err(SupervisorError::AgentControl(error));
        }
        self.refresh()
    }

    pub fn shutdown(&self) -> Result<(), SupervisorError> {
        self.update_snapshot(|snapshot| snapshot.state = TrayState::Stopping);
        self.agent.shutdown()?;
        Ok(())
    }

    fn update_snapshot(&self, update: impl FnOnce(&mut TraySnapshot)) {
        if let Ok(mut snapshot) = self.snapshot.write() {
            update(&mut snapshot);
        }
    }
}

#[must_use]
pub fn state_from_health(health: &AgentHealth) -> TrayState {
    match health.process.state.as_str() {
        "starting" => TrayState::Starting,
        "switching" => TrayState::SwitchingEnvironment,
        "stopping" | "stopped" => TrayState::Stopping,
        "ready" if health.backend.status == "connected" => TrayState::Ready,
        "ready" | "degraded" => TrayState::BackendOffline,
        _ => TrayState::Error,
    }
}

pub struct SpawnedAgent {
    child: Child,
    identity: ProcessIdentity,
    entry_point: PathBuf,
}

impl SpawnedAgent {
    pub fn try_wait(&mut self) -> std::io::Result<Option<std::process::ExitStatus>> {
        self.child.try_wait()
    }

    #[must_use]
    pub fn identity(&self) -> &ProcessIdentity {
        &self.identity
    }

    pub fn coordinated_stop(
        &mut self,
        record: Option<&AgentInstanceRecord>,
        inspector: &impl ProcessInspector,
        graceful_timeout: Duration,
    ) -> Result<bool, SupervisorError> {
        if self.child.try_wait()?.is_some() {
            return Ok(false);
        }
        let live_identity_valid = exact_process_identity(&self.identity, inspector);
        let identity_valid = live_identity_valid
            && record.is_none_or(|record| {
                record.pid == self.identity.pid
                    && same_path(&record.executable_path, &self.identity.executable_path)
                    && same_path(&record.entry_point, &self.entry_point)
            });
        if !identity_valid {
            return Err(SupervisorError::ChildIdentityMismatch);
        }
        if let Some(record) = record {
            let _ = AgentControlClient::new(record.clone())
                .with_timeout(Duration::from_millis(500))
                .shutdown();
        }
        let deadline = Instant::now() + graceful_timeout;
        while Instant::now() < deadline {
            if self.child.try_wait()?.is_some() {
                return Ok(false);
            }
            thread::sleep(Duration::from_millis(25));
        }
        if !exact_process_identity(&self.identity, inspector) {
            return Err(SupervisorError::ChildIdentityMismatch);
        }
        self.child.kill()?;
        let _ = self.child.wait()?;
        Ok(true)
    }
}

pub fn spawn_bundled_agent(
    config: &AgentLaunchConfig,
    inspector: &impl ProcessInspector,
) -> Result<SpawnedAgent, SupervisorError> {
    let mut command = Command::new(&config.node_executable);
    command
        .arg(&config.agent_entry_point)
        .arg("--user-data-dir")
        .arg(&config.user_data_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    if let Some(catalog) = &config.environment_catalog {
        command.env("CTHUTOOL_AGENT_ENVIRONMENTS_PATH", catalog);
    }
    let child = command.spawn()?;
    let pid = child.id();
    let identity = (0..20)
        .find_map(|_| {
            let identity = inspector.inspect(pid);
            if identity.is_none() {
                thread::sleep(Duration::from_millis(10));
            }
            identity
        })
        .ok_or(SupervisorError::ChildIdentityMismatch)?;
    Ok(SpawnedAgent {
        child,
        identity,
        entry_point: config.agent_entry_point.clone(),
    })
}

pub fn wait_for_agent_readiness(
    config: &AgentLaunchConfig,
    child: &ProcessIdentity,
    timeout: Duration,
) -> Result<(AgentInstanceRecord, AgentHealth), SupervisorError> {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if let Ok(record) = AgentInstanceRecord::read(&config.instance_path())
            && record.pid == child.pid
            && same_path(&record.executable_path, &child.executable_path)
            && let Ok(health) = AgentControlClient::new(record.clone())
                .with_timeout(Duration::from_millis(500))
                .health()
        {
            return Ok((record, health));
        }
        thread::sleep(Duration::from_millis(25));
    }
    Err(SupervisorError::ReadinessTimeout)
}

#[must_use]
pub fn exact_process_identity(
    expected: &ProcessIdentity,
    inspector: &impl ProcessInspector,
) -> bool {
    inspector.inspect(expected.pid).is_some_and(|actual| {
        actual.pid == expected.pid
            && actual.process_started_at == expected.process_started_at
            && same_path(&actual.executable_path, &expected.executable_path)
    })
}

fn same_path(left: &Path, right: &Path) -> bool {
    fs::canonicalize(left).unwrap_or_else(|_| left.to_path_buf())
        == fs::canonicalize(right).unwrap_or_else(|_| right.to_path_buf())
}

#[must_use]
pub const fn default_inspector() -> SystemProcessInspector {
    SystemProcessInspector
}

#[cfg(test)]
mod tests {
    use super::{
        AgentOperations, SupervisorError, TrayInteraction, exact_process_identity,
        state_from_health,
    };
    use crate::{
        agent_control::{
            AgentBackendHealth, AgentBridgeLaunch, AgentControlError, AgentEnvironmentHealth,
            AgentHealth, AgentProcessHealth,
        },
        instance::{ProcessIdentity, ProcessInspector},
        launch::BrowserOpener,
        model::{EnvironmentSummary, TraySnapshot, TrayState},
    };
    use std::{
        collections::{HashMap, VecDeque},
        path::PathBuf,
        sync::{Arc, Mutex, RwLock},
    };
    use url::Url;

    struct FakeAgent {
        health: AgentHealth,
        environments: Vec<EnvironmentSummary>,
        launches: Mutex<VecDeque<Result<AgentBridgeLaunch, AgentControlError>>>,
        switches: Mutex<Vec<String>>,
        switch_error: Option<String>,
    }

    impl AgentOperations for FakeAgent {
        fn health(&self) -> Result<AgentHealth, AgentControlError> {
            Ok(self.health.clone())
        }

        fn environments(&self) -> Result<Vec<EnvironmentSummary>, AgentControlError> {
            Ok(self.environments.clone())
        }

        fn switch_environment(&self, environment_id: &str) -> Result<(), AgentControlError> {
            self.switches
                .lock()
                .expect("switch lock")
                .push(environment_id.into());
            self.switch_error.as_ref().map_or(Ok(()), |message| {
                Err(AgentControlError::Rejected {
                    code: "ENVIRONMENT_SWITCH_FAILED".into(),
                    message: message.clone(),
                })
            })
        }

        fn issue_bridge_launch(&self) -> Result<AgentBridgeLaunch, AgentControlError> {
            self.launches
                .lock()
                .expect("launch lock")
                .pop_front()
                .expect("launch fixture")
        }

        fn shutdown(&self) -> Result<(), AgentControlError> {
            Ok(())
        }
    }

    #[derive(Default)]
    struct FakeBrowser(Mutex<Vec<String>>);

    impl BrowserOpener for FakeBrowser {
        fn open(&self, url: &Url) -> Result<(), String> {
            self.0.lock().expect("browser lock").push(url.to_string());
            Ok(())
        }
    }

    fn health(backend_status: &str) -> AgentHealth {
        AgentHealth {
            application_version: "0.1.0".into(),
            protocol_version: 1,
            process: AgentProcessHealth {
                state: "ready".into(),
            },
            backend: AgentBackendHealth {
                status: backend_status.into(),
                last_error: None,
            },
            environment: AgentEnvironmentHealth {
                id: Some("prod".into()),
                label: Some("Production".into()),
            },
        }
    }

    fn launch(ticket: &str) -> AgentBridgeLaunch {
        AgentBridgeLaunch {
            endpoint: "http://127.0.0.1:43123".into(),
            environment_id: "prod".into(),
            expires_at: "2026-07-22T01:00:00.000Z".into(),
            instance_id: "instance-1".into(),
            launch_url: format!(
                "https://app.example.com/agent#endpoint=http%3A%2F%2F127.0.0.1%3A43123&environment=prod&instance=instance-1&ticket={ticket}"
            ),
        }
    }

    fn agent(launches: Vec<Result<AgentBridgeLaunch, AgentControlError>>) -> FakeAgent {
        FakeAgent {
            health: health("connected"),
            environments: vec![
                EnvironmentSummary {
                    active: true,
                    id: "prod".into(),
                    label: "Production".into(),
                },
                EnvironmentSummary {
                    active: false,
                    id: "staging".into(),
                    label: "Staging".into(),
                },
            ],
            launches: Mutex::new(launches.into()),
            switches: Mutex::new(Vec::new()),
            switch_error: None,
        }
    }

    #[test]
    fn repeated_activation_requests_distinct_fresh_tickets() {
        let snapshot = Arc::new(RwLock::new(TraySnapshot {
            active_environment_id: Some("prod".into()),
            ..TraySnapshot::default()
        }));
        let interaction = TrayInteraction::new(
            agent(vec![
                Ok(launch("abcdefghijklmnopqrstuvwxyz123456")),
                Ok(launch("abcdefghijklmnopqrstuvwxyz654321")),
            ]),
            FakeBrowser::default(),
            snapshot,
        );

        interaction.open().expect("first open");
        interaction.open().expect("second open");
        assert_eq!(interaction.browser.0.lock().expect("browser lock").len(), 2);
    }

    #[test]
    fn unavailable_bridge_does_not_open_browser() {
        let snapshot = Arc::new(RwLock::new(TraySnapshot {
            active_environment_id: Some("prod".into()),
            ..TraySnapshot::default()
        }));
        let interaction = TrayInteraction::new(
            agent(vec![Err(AgentControlError::Rejected {
                code: "UNKNOWN_OPERATION".into(),
                message: "bridge unavailable".into(),
            })]),
            FakeBrowser::default(),
            snapshot,
        );

        assert!(matches!(
            interaction.open(),
            Err(SupervisorError::BridgeUnavailable(_))
        ));
        assert!(
            interaction
                .browser
                .0
                .lock()
                .expect("browser lock")
                .is_empty()
        );
    }

    #[test]
    fn invalid_environment_is_rejected_before_switch() {
        let interaction = TrayInteraction::new(
            agent(Vec::new()),
            FakeBrowser::default(),
            Arc::new(RwLock::new(TraySnapshot::default())),
        );

        assert!(matches!(
            interaction.switch_environment("unknown"),
            Err(SupervisorError::InvalidEnvironment(value)) if value == "unknown"
        ));
        assert!(
            interaction
                .agent
                .switches
                .lock()
                .expect("switch lock")
                .is_empty()
        );
    }

    #[test]
    fn failed_switch_keeps_target_selected_and_cleans_switching_state() {
        let mut fake = agent(Vec::new());
        fake.switch_error = Some("backend unavailable".into());
        let snapshot = Arc::new(RwLock::new(TraySnapshot::default()));
        let interaction = TrayInteraction::new(fake, FakeBrowser::default(), Arc::clone(&snapshot));

        assert!(interaction.switch_environment("staging").is_err());
        let state = snapshot.read().expect("snapshot");
        assert_eq!(state.state, TrayState::BackendOffline);
        assert_eq!(state.active_environment_id.as_deref(), Some("staging"));
        assert_eq!(
            state
                .environments
                .iter()
                .find(|environment| environment.active)
                .map(|environment| environment.id.as_str()),
            Some("staging")
        );
    }

    #[test]
    fn backend_connectivity_is_distinct_from_process_readiness() {
        assert_eq!(state_from_health(&health("connected")), TrayState::Ready);
        assert_eq!(
            state_from_health(&health("reconnecting")),
            TrayState::BackendOffline
        );
    }

    struct FakeInspector(HashMap<u32, ProcessIdentity>);

    impl ProcessInspector for FakeInspector {
        fn inspect(&self, pid: u32) -> Option<ProcessIdentity> {
            self.0.get(&pid).cloned()
        }
    }

    #[test]
    fn force_termination_guard_rejects_unrelated_reused_pid() {
        let expected = ProcessIdentity {
            pid: 77,
            executable_path: PathBuf::from("/opt/cthutool/node"),
            process_started_at: 100,
        };
        let reused = FakeInspector(HashMap::from([(
            77,
            ProcessIdentity {
                pid: 77,
                executable_path: PathBuf::from("/usr/bin/other"),
                process_started_at: 101,
            },
        )]));

        assert!(!exact_process_identity(&expected, &reused));
    }

    #[cfg(unix)]
    #[test]
    fn coordinated_exit_confirms_agent_child_is_no_longer_alive() {
        use crate::instance::SystemProcessInspector;
        use std::{process::Command, thread, time::Duration};

        let child = Command::new("/bin/sleep")
            .arg("30")
            .spawn()
            .expect("spawn disposable child");
        let pid = child.id();
        let inspector = SystemProcessInspector;
        let identity = (0..20)
            .find_map(|_| {
                let identity = inspector.inspect(pid);
                if identity.is_none() {
                    thread::sleep(Duration::from_millis(10));
                }
                identity
            })
            .expect("child identity");
        let entry_point = PathBuf::from("/opt/cthutool/agent.js");
        let record = crate::agent_control::AgentInstanceRecord {
            protocol_version: 1,
            pid,
            nonce: "ephemeral-test-nonce".into(),
            control_endpoint: "/tmp/non-existent-agent-control.sock".into(),
            executable_path: identity.executable_path.clone(),
            entry_point: entry_point.clone(),
            started_at: "2026-07-22T00:00:00.000Z".into(),
        };
        let mut spawned = super::SpawnedAgent {
            child,
            identity,
            entry_point,
        };

        assert!(
            spawned
                .coordinated_stop(Some(&record), &inspector, Duration::from_millis(20))
                .expect("coordinated stop used exact child identity")
        );
        assert!(spawned.try_wait().expect("child exit state").is_some());
    }
}
