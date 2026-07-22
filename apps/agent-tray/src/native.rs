use std::{
    fs,
    path::{Path, PathBuf},
    sync::{
        Arc, RwLock,
        mpsc::{Receiver, RecvTimeoutError, Sender},
    },
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};

use tray_icon::{
    Icon, MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent,
    menu::{CheckMenuItem, Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu},
};
use winit::{
    application::ApplicationHandler,
    event::WindowEvent,
    event_loop::{ActiveEventLoop, EventLoopProxy},
    window::WindowId,
};

use crate::{
    agent_control::{AgentControlClient, AgentInstanceRecord},
    backoff::{RestartDecision, RestartPolicy},
    icon::{ICON_SIZE, tray_icon_rgba},
    launch::SystemBrowserOpener,
    model::{TraySnapshot, TrayState},
    platform::{ActivationGesture, current_platform, should_open},
    supervisor::{
        AgentLaunchConfig, TrayInteraction, spawn_bundled_agent, wait_for_agent_readiness,
    },
    tray_control::TrayCommand,
};

#[derive(Clone, Debug)]
pub enum NativeEvent {
    Tray(TrayIconEvent),
    Menu(MenuEvent),
    SnapshotChanged,
    ExitReady,
}

pub struct NativeTrayApplication {
    snapshot: Arc<RwLock<TraySnapshot>>,
    commands: Sender<TrayCommand>,
    tray: Option<TrayIcon>,
    shutdown_queued: bool,
}

impl NativeTrayApplication {
    #[must_use]
    pub fn new(snapshot: Arc<RwLock<TraySnapshot>>, commands: Sender<TrayCommand>) -> Self {
        Self {
            snapshot,
            commands,
            tray: None,
            shutdown_queued: false,
        }
    }

    fn create_tray(&mut self) -> Result<(), String> {
        if self.tray.is_some() {
            return Ok(());
        }
        let snapshot = self
            .snapshot
            .read()
            .map_or_else(|_| TraySnapshot::default(), |snapshot| snapshot.clone());
        let menu = create_native_menu(&snapshot)?;
        let icon = Icon::from_rgba(tray_icon_rgba(), ICON_SIZE, ICON_SIZE)
            .map_err(|error| error.to_string())?;
        self.tray = Some(
            TrayIconBuilder::new()
                .with_icon(icon)
                .with_icon_as_template(cfg!(target_os = "macos"))
                .with_tooltip(snapshot.accessibility_label())
                .with_menu(Box::new(menu))
                .with_menu_on_left_click(false)
                .with_menu_on_right_click(true)
                .build()
                .map_err(|error| error.to_string())?,
        );
        Ok(())
    }

    fn refresh_tray(&self) {
        let (Some(tray), Ok(snapshot)) = (&self.tray, self.snapshot.read()) else {
            return;
        };
        if let Ok(menu) = create_native_menu(&snapshot) {
            tray.set_menu(Some(Box::new(menu)));
        }
        let _ = tray.set_tooltip(Some(snapshot.accessibility_label()));
    }

    fn queue_shutdown(&mut self) {
        if !self.shutdown_queued {
            self.shutdown_queued = true;
            let _ = self.commands.send(TrayCommand::Shutdown);
        }
    }
}

impl ApplicationHandler<NativeEvent> for NativeTrayApplication {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if let Err(error) = self.create_tray() {
            if let Ok(mut snapshot) = self.snapshot.write() {
                snapshot.state = TrayState::Error;
                snapshot.detail = Some(error);
            }
            event_loop.exit();
        }
    }

    fn user_event(&mut self, event_loop: &ActiveEventLoop, event: NativeEvent) {
        match event {
            NativeEvent::Tray(event) => {
                let gesture = match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => Some(ActivationGesture::PrimaryClick),
                    TrayIconEvent::DoubleClick {
                        button: MouseButton::Left,
                        ..
                    } => Some(ActivationGesture::DoubleClick),
                    _ => None,
                };
                if gesture.is_some_and(|gesture| should_open(current_platform(), gesture)) {
                    let _ = self.commands.send(TrayCommand::Open);
                }
            }
            NativeEvent::Menu(event) => {
                let id = event.id().0.as_str();
                if id == "open" {
                    let _ = self.commands.send(TrayCommand::Open);
                } else if id == "exit" {
                    self.queue_shutdown();
                } else if let Some(environment_id) = id.strip_prefix("environment:") {
                    let _ = self
                        .commands
                        .send(TrayCommand::SwitchEnvironment(environment_id.into()));
                }
            }
            NativeEvent::SnapshotChanged => self.refresh_tray(),
            NativeEvent::ExitReady => event_loop.exit(),
        }
    }

    fn window_event(
        &mut self,
        _event_loop: &ActiveEventLoop,
        _window_id: WindowId,
        _event: WindowEvent,
    ) {
        // No native application window is ever created.
    }

    fn exiting(&mut self, _event_loop: &ActiveEventLoop) {
        self.queue_shutdown();
    }
}

fn create_native_menu(snapshot: &TraySnapshot) -> Result<Menu, String> {
    let menu = Menu::new();
    let status = MenuItem::with_id("status", snapshot.state.label(), false, None);
    let open = MenuItem::with_id("open", "Open CthuTool", true, None);
    let environments = Submenu::with_id("environments", "Environment", true);
    for environment in &snapshot.environments {
        environments
            .append(&CheckMenuItem::with_id(
                format!("environment:{}", environment.id),
                &environment.label,
                true,
                environment.active,
                None,
            ))
            .map_err(|error| error.to_string())?;
    }
    let separator = PredefinedMenuItem::separator();
    let exit = MenuItem::with_id("exit", "Exit", true, None);
    menu.append_items(&[&status, &open, &environments, &separator, &exit])
        .map_err(|error| error.to_string())?;
    Ok(menu)
}

/// Constructs the native icon and menu without registering a visible tray item.
///
/// # Errors
///
/// Returns an error when the current platform cannot construct native tray assets.
pub fn smoke_test_native_assets() -> Result<(), String> {
    Icon::from_rgba(tray_icon_rgba(), ICON_SIZE, ICON_SIZE).map_err(|error| error.to_string())?;
    let _menu = create_native_menu(&TraySnapshot::default())?;
    Ok(())
}

pub fn install_native_event_forwarders(proxy: &EventLoopProxy<NativeEvent>) {
    let tray_proxy = proxy.clone();
    TrayIconEvent::set_event_handler(Some(move |event| {
        let _ = tray_proxy.send_event(NativeEvent::Tray(event));
    }));
    let menu_proxy = proxy.clone();
    MenuEvent::set_event_handler(Some(move |event| {
        let _ = menu_proxy.send_event(NativeEvent::Menu(event));
    }));
}

pub fn spawn_supervisor_worker(
    config: AgentLaunchConfig,
    snapshot: Arc<RwLock<TraySnapshot>>,
    commands: Receiver<TrayCommand>,
    proxy: EventLoopProxy<NativeEvent>,
) -> JoinHandle<()> {
    thread::Builder::new()
        .name("cthutool-agent-supervisor".into())
        .spawn(move || supervisor_worker(config, &snapshot, &commands, &proxy))
        .expect("spawn Agent supervisor")
}

fn supervisor_worker(
    config: AgentLaunchConfig,
    snapshot: &Arc<RwLock<TraySnapshot>>,
    commands: &Receiver<TrayCommand>,
    proxy: &EventLoopProxy<NativeEvent>,
) {
    let inspector = crate::supervisor::default_inspector();
    let mut restart_policy = RestartPolicy::production();
    let epoch = Instant::now();
    loop {
        update_snapshot(snapshot, proxy, |state| {
            state.state = TrayState::Starting;
            state.detail = None;
        });
        let mut child = match spawn_bundled_agent(&config, &inspector) {
            Ok(child) => child,
            Err(error) => {
                if !handle_failed_start(
                    error.to_string(),
                    &mut restart_policy,
                    epoch.elapsed(),
                    snapshot,
                    commands,
                    proxy,
                ) {
                    break;
                }
                continue;
            }
        };
        let readiness =
            wait_for_agent_readiness(&config, child.identity(), Duration::from_secs(10));
        let (record, _health) = match readiness {
            Ok(ready) => ready,
            Err(error) => {
                let record = AgentInstanceRecord::read(&config.instance_path()).ok();
                let _ = child.coordinated_stop(record.as_ref(), &inspector, Duration::from_secs(2));
                cleanup_owned_agent_artifacts(&config.user_data_dir, record.as_ref());
                if !handle_failed_start(
                    error.to_string(),
                    &mut restart_policy,
                    epoch.elapsed(),
                    snapshot,
                    commands,
                    proxy,
                ) {
                    break;
                }
                continue;
            }
        };
        let interaction = TrayInteraction::new(
            AgentControlClient::new(record.clone()),
            SystemBrowserOpener,
            Arc::clone(snapshot),
        );
        let _ = interaction.refresh();
        let _ = proxy.send_event(NativeEvent::SnapshotChanged);
        let running_since = Instant::now();
        let mut shutdown = false;
        loop {
            match commands.recv_timeout(Duration::from_millis(250)) {
                Ok(TrayCommand::Open) => {
                    if let Err(error) = interaction.open() {
                        update_snapshot(snapshot, proxy, |state| {
                            state.detail = Some(error.to_string());
                        });
                    }
                }
                Ok(TrayCommand::SwitchEnvironment(environment_id)) => {
                    if let Err(error) = interaction.switch_environment(&environment_id) {
                        update_snapshot(snapshot, proxy, |state| {
                            state.detail = Some(error.to_string());
                        });
                    }
                    let _ = proxy.send_event(NativeEvent::SnapshotChanged);
                }
                Ok(TrayCommand::Shutdown) | Err(RecvTimeoutError::Disconnected) => {
                    shutdown = true;
                    break;
                }
                Err(RecvTimeoutError::Timeout) => {}
            }
            match child.try_wait() {
                Ok(Some(_)) | Err(_) => break,
                Ok(None) => {}
            }
            if running_since.elapsed() > Duration::from_secs(60) {
                restart_policy.record_stable_run();
            }
            let _ = interaction.refresh();
            let _ = proxy.send_event(NativeEvent::SnapshotChanged);
        }
        if shutdown {
            update_snapshot(snapshot, proxy, |state| state.state = TrayState::Stopping);
            let _ = child.coordinated_stop(Some(&record), &inspector, Duration::from_secs(5));
            cleanup_owned_agent_artifacts(&config.user_data_dir, Some(&record));
            break;
        }
        cleanup_owned_agent_artifacts(&config.user_data_dir, Some(&record));
        if !handle_failed_start(
            "Agent process exited unexpectedly".into(),
            &mut restart_policy,
            epoch.elapsed(),
            snapshot,
            commands,
            proxy,
        ) {
            break;
        }
    }
    let _ = proxy.send_event(NativeEvent::ExitReady);
}

fn handle_failed_start(
    detail: String,
    policy: &mut RestartPolicy,
    now: Duration,
    snapshot: &Arc<RwLock<TraySnapshot>>,
    commands: &Receiver<TrayCommand>,
    proxy: &EventLoopProxy<NativeEvent>,
) -> bool {
    match policy.record_failure(now) {
        RestartDecision::Latched => {
            update_snapshot(snapshot, proxy, |state| {
                state.state = TrayState::CrashLoop;
                state.detail = Some(detail);
            });
            loop {
                match commands.recv() {
                    Ok(TrayCommand::Shutdown) | Err(_) => return false,
                    Ok(TrayCommand::Open | TrayCommand::SwitchEnvironment(_)) => {}
                }
            }
        }
        RestartDecision::RetryAfter(delay) => {
            update_snapshot(snapshot, proxy, |state| {
                state.state = TrayState::Error;
                state.detail = Some(detail);
            });
            !matches!(
                commands.recv_timeout(delay),
                Ok(TrayCommand::Shutdown) | Err(RecvTimeoutError::Disconnected)
            )
        }
    }
}

fn update_snapshot(
    snapshot: &RwLock<TraySnapshot>,
    proxy: &EventLoopProxy<NativeEvent>,
    update: impl FnOnce(&mut TraySnapshot),
) {
    if let Ok(mut state) = snapshot.write() {
        update(&mut state);
    }
    let _ = proxy.send_event(NativeEvent::SnapshotChanged);
}

fn cleanup_owned_agent_artifacts(data_dir: &Path, record: Option<&AgentInstanceRecord>) {
    let Some(record) = record else {
        return;
    };
    let mut candidates = vec![
        data_dir.join("runtime").join("instance.json"),
        data_dir
            .join("browser-profiles")
            .join(".cthutool-agent.lock"),
    ];
    let environments_dir = data_dir.join("environments");
    if let Ok(environments) = fs::read_dir(environments_dir) {
        candidates.extend(environments.flatten().map(|environment| {
            environment
                .path()
                .join("browser-profiles")
                .join(".cthutool-agent.lock")
        }));
    }
    for candidate in candidates {
        if AgentInstanceRecord::read(&candidate)
            .is_ok_and(|candidate_record| candidate_record == *record)
        {
            let _ = fs::remove_file(candidate);
        }
    }
    if !cfg!(windows) {
        let _ = fs::remove_file(PathBuf::from(&record.control_endpoint));
    }
}

#[cfg(test)]
mod tests {
    use super::cleanup_owned_agent_artifacts;
    use crate::agent_control::AgentInstanceRecord;
    use std::{fs, path::PathBuf};
    use uuid::Uuid;

    #[test]
    fn forced_exit_cleanup_removes_only_records_owned_by_agent_child() {
        let root = std::env::temp_dir().join(format!("cta-cleanup-{}", Uuid::new_v4()));
        let owned_path = root.join("runtime/instance.json");
        let unrelated_path =
            root.join("environments/staging/browser-profiles/.cthutool-agent.lock");
        fs::create_dir_all(owned_path.parent().expect("owned parent")).expect("owned dir");
        fs::create_dir_all(unrelated_path.parent().expect("unrelated parent"))
            .expect("unrelated dir");
        let owned = AgentInstanceRecord {
            protocol_version: 1,
            pid: 42,
            nonce: "owned-nonce".into(),
            control_endpoint: root
                .join("runtime/control.sock")
                .to_string_lossy()
                .into_owned(),
            executable_path: PathBuf::from("/opt/cthutool/node"),
            entry_point: PathBuf::from("/opt/cthutool/agent.js"),
            started_at: "2026-07-22T00:00:00.000Z".into(),
        };
        let unrelated = AgentInstanceRecord {
            pid: 42,
            nonce: "unrelated-nonce".into(),
            ..owned.clone()
        };
        fs::write(&owned_path, serde_json::to_vec(&owned).expect("owned json"))
            .expect("owned record");
        fs::write(
            &unrelated_path,
            serde_json::to_vec(&unrelated).expect("unrelated json"),
        )
        .expect("unrelated record");

        cleanup_owned_agent_artifacts(&root, Some(&owned));

        assert!(!owned_path.exists());
        assert!(unrelated_path.exists());
        let _ = fs::remove_dir_all(root);
    }
}
