mod app_state;
mod tray_client;

use std::{
    env,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    thread,
};

use cthutool_agent_tray::self_use_config::OriginValidationOptions;
use slint::ComponentHandle;

use crate::{
    app_state::{SetupAppState, UiMode, connection_status_label},
    tray_client::SetupTrayClient,
};

slint::include_modules!();

fn main() {
    if env::args().any(|argument| argument == "--smoke-test") {
        println!("native setup smoke test passed");
        return;
    }
    if let Err(error) = run() {
        eprintln!("CthuTool Agent setup failed: {error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let data_dir = resolve_data_dir()?;
    let forced_mode = parse_mode_arg();
    let options = OriginValidationOptions::from_env();

    let ui = AppWindow::new()?;
    let state = Arc::new(Mutex::new(initial_state(&data_dir, forced_mode, &ui)?));
    sync_ui(&ui, &state.lock().expect("setup state lock"));

    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        ui.on_origin_edited(move |value| {
            let mut guard = state.lock().expect("setup state lock");
            guard.origin = value.as_str().to_owned();
            guard.refresh_endpoint_preview(options);
            if let Some(ui) = ui_weak.upgrade() {
                sync_ui(&ui, &guard);
            }
        });
    }
    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        ui.on_device_name_edited(move |value| {
            let mut guard = state.lock().expect("setup state lock");
            guard.device_name = value.as_str().to_owned();
            if let Some(ui) = ui_weak.upgrade() {
                sync_ui(&ui, &guard);
            }
        });
    }
    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        ui.on_connection_enabled_toggled(move |enabled| {
            let mut guard = state.lock().expect("setup state lock");
            guard.connection_enabled = enabled;
            if let Some(ui) = ui_weak.upgrade() {
                sync_ui(&ui, &guard);
            }
        });
    }
    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        let data_dir = data_dir.clone();
        ui.on_primary_action(move || {
            let Some(ui) = ui_weak.upgrade() else {
                return;
            };
            run_primary_action(&ui, &state, &data_dir, options);
        });
    }
    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        ui.on_cancel_action(move || {
            let mut guard = state.lock().expect("setup state lock");
            let _ = guard.cancel_first_run();
            if let Some(ui) = ui_weak.upgrade() {
                sync_ui(&ui, &guard);
                let _ = ui.window().hide();
            }
            // Exit after cancel so the tray can remain in SetupRequired.
            std::process::exit(0);
        });
    }
    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        let data_dir = data_dir.clone();
        ui.on_open_web_console(move || {
            let Some(ui) = ui_weak.upgrade() else {
                return;
            };
            match SetupTrayClient::connect(&data_dir).and_then(|client| client.open_web_console()) {
                Ok(()) => {
                    let mut guard = state.lock().expect("setup state lock");
                    guard.action_error = None;
                    sync_ui(&ui, &guard);
                }
                Err(message) => {
                    let mut guard = state.lock().expect("setup state lock");
                    guard.set_action_error(message);
                    sync_ui(&ui, &guard);
                }
            }
        });
    }
    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        ui.on_show_about_slint(move || {
            let mut guard = state.lock().expect("setup state lock");
            guard.set_about_visible(true);
            if let Some(ui) = ui_weak.upgrade() {
                sync_ui(&ui, &guard);
            }
        });
    }
    {
        let ui_weak = ui.as_weak();
        let state = Arc::clone(&state);
        ui.on_hide_about_slint(move || {
            let mut guard = state.lock().expect("setup state lock");
            guard.set_about_visible(false);
            if let Some(ui) = ui_weak.upgrade() {
                sync_ui(&ui, &guard);
            }
        });
    }

    ui.run()?;
    Ok(())
}

fn initial_state(
    data_dir: &Path,
    forced_mode: Option<UiMode>,
    ui: &AppWindow,
) -> Result<SetupAppState, Box<dyn std::error::Error>> {
    match SetupTrayClient::connect(data_dir) {
        Ok(client) => {
            let setup = client.setup_get()?;
            let (status, detail) = match client.health() {
                Ok(snapshot) => (
                    connection_status_label(&snapshot.state).to_owned(),
                    snapshot.detail.unwrap_or_default(),
                ),
                Err(error) => ("Tray unreachable".into(), error),
            };
            let state = SetupAppState::from_setup_state(&setup, status, detail, forced_mode);
            Ok(state)
        }
        Err(error) => {
            // Allow the window to open with an actionable error when tray is down.
            let mut state = SetupAppState::from_setup_state(
                &cthutool_agent_tray::self_use_config::SelfUseSetupState {
                    configured: false,
                    setup_required: true,
                    deployment_origin: None,
                    endpoints: None,
                    device_name: default_device_name(),
                    connection_enabled: true,
                    agent_id: String::new(),
                    browser_executable_path: None,
                },
                "Tray unreachable",
                error.clone(),
                forced_mode.or(Some(UiMode::FirstRun)),
            );
            state.set_action_error(error);
            sync_ui(ui, &state);
            Ok(state)
        }
    }
}

fn run_primary_action(
    ui: &AppWindow,
    state: &Arc<Mutex<SetupAppState>>,
    data_dir: &Path,
    options: OriginValidationOptions,
) {
    {
        let mut guard = state.lock().expect("setup state lock");
        if guard.is_busy() {
            return;
        }
        if !guard.validate_current_form(options) {
            sync_ui(ui, &guard);
            return;
        }
        guard.begin_apply();
        sync_ui(ui, &guard);
    }

    let payload = state
        .lock()
        .expect("setup state lock")
        .build_apply_payload();
    let data_dir = data_dir.to_path_buf();
    let state = Arc::clone(state);
    let worker_state = Arc::clone(&state);
    let ui_weak = ui.as_weak();
    let worker = thread::Builder::new()
        .name("cthutool-agent-setup-apply".into())
        .spawn(move || {
            let result = (|| {
                let client = SetupTrayClient::connect(&data_dir)?;
                let setup = client.setup_apply(&payload)?;
                let status = client
                    .health()
                    .map(|snapshot| connection_status_label(&snapshot.state).to_owned())
                    .unwrap_or_else(|_| "Configuration saved".into());
                Ok::<_, String>((setup, status))
            })();

            let _ = slint::invoke_from_event_loop(move || {
                let Some(ui) = ui_weak.upgrade() else {
                    return;
                };
                let mut guard = worker_state.lock().expect("setup state lock");
                match result {
                    Ok((setup, status)) => guard.apply_succeeded(&setup, &status),
                    Err(message) => guard.apply_failed(message),
                }
                sync_ui(&ui, &guard);
            });
        });

    if let Err(error) = worker {
        let mut guard = state.lock().expect("setup state lock");
        guard.apply_failed(format!("Could not start configuration worker: {error}"));
        sync_ui(ui, &guard);
    }
}

fn sync_ui(ui: &AppWindow, state: &SetupAppState) {
    ui.set_first_run(state.mode == UiMode::FirstRun);
    ui.set_window_subtitle(match state.mode {
        UiMode::FirstRun => "Enter your deployment Origin to connect this device.".into(),
        UiMode::Settings => "Update connection settings owned by the native Agent.".into(),
    });
    ui.set_origin(state.origin.clone().into());
    ui.set_device_name(state.device_name.clone().into());
    ui.set_connection_status(state.connection_status.clone().into());
    ui.set_connection_detail(state.connection_detail.clone().into());
    ui.set_connection_enabled(state.connection_enabled);
    ui.set_web_agent_url(state.endpoints.web_agent_url.clone().into());
    ui.set_backend_http_url(state.endpoints.backend_http_url.clone().into());
    ui.set_backend_ws_url(state.endpoints.backend_agent_ws_url.clone().into());
    ui.set_origin_error(state.form_errors.origin.clone().unwrap_or_default().into());
    ui.set_action_error(state.action_error.clone().unwrap_or_default().into());
    ui.set_primary_action_label(state.primary_action_label().into());
    ui.set_busy(state.is_busy());
    ui.set_show_about(state.show_about);
    ui.set_status_banner(if state.apply_phase == app_state::ApplyPhase::Succeeded {
        "Configuration saved. The Agent will reconnect with the new settings.".into()
    } else if state.is_busy() {
        "Verifying and applying configuration…".into()
    } else {
        String::new().into()
    });
}

fn resolve_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    if let Some(value) = argument_value("--user-data-dir")
        .or_else(|| env::var_os("CTHUTOOL_AGENT_DATA_DIR").map(PathBuf::from))
    {
        return Ok(value);
    }
    #[cfg(target_os = "macos")]
    let root = env::var_os("HOME")
        .map(PathBuf::from)
        .map(|home| home.join("Library/Application Support/CthuTool/agent"));
    #[cfg(target_os = "windows")]
    let root = env::var_os("APPDATA")
        .map(PathBuf::from)
        .map(|app_data| app_data.join("CthuTool").join("agent"));
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let root = env::var_os("XDG_STATE_HOME")
        .map(PathBuf::from)
        .or_else(|| env::var_os("HOME").map(|home| PathBuf::from(home).join(".local/state")))
        .map(|state| state.join("cthutool/agent"));
    root.ok_or_else(|| "cannot resolve CthuTool Agent data directory".into())
}

fn parse_mode_arg() -> Option<UiMode> {
    let value = argument_value("--mode")?;
    match value.to_string_lossy().as_ref() {
        "first-run" => Some(UiMode::FirstRun),
        "settings" => Some(UiMode::Settings),
        other => {
            eprintln!("unknown --mode {other:?}; expected first-run|settings");
            None
        }
    }
}

fn argument_value(name: &str) -> Option<PathBuf> {
    let arguments: Vec<_> = env::args_os().collect();
    arguments
        .iter()
        .position(|argument| argument == name)
        .and_then(|index| arguments.get(index + 1))
        .map(PathBuf::from)
}

fn default_device_name() -> String {
    env::var("COMPUTERNAME")
        .or_else(|_| env::var("HOSTNAME"))
        .unwrap_or_else(|_| "cthutool-agent".into())
}

#[cfg(test)]
mod cli_tests {
    use super::default_device_name;

    #[test]
    fn default_device_name_is_non_empty() {
        assert!(!default_device_name().is_empty());
    }
}
