//! Thin tray IPC wrapper for the setup window.

use std::path::Path;

use cthutool_agent_tray::{
    instance::InstanceRegistry,
    model::TraySnapshot,
    self_use_config::SelfUseSetupState,
    tray_control::{
        SetupRequestPayload, TrayControlClient, TrayControlError, instance_record_path,
    },
};

use crate::app_state::format_tray_error;

#[derive(Debug)]
pub struct SetupTrayClient {
    client: TrayControlClient,
}

impl SetupTrayClient {
    pub fn connect(user_data_dir: &Path) -> Result<Self, String> {
        let path = instance_record_path(user_data_dir);
        if !path.is_file() {
            return Err(
                "Agent tray is not running (missing tray-instance.json). Start CthuTool Agent, then reopen this window."
                    .into(),
            );
        }
        let registry = InstanceRegistry::new(path);
        let record = registry.read().map_err(|error| {
            format!(
                "Could not load tray instance record: {error}. Restart the Agent tray and try again."
            )
        })?;
        Ok(Self {
            client: TrayControlClient::new(record),
        })
    }

    pub fn setup_get(&self) -> Result<SelfUseSetupState, String> {
        self.client.setup_get().map_err(map_error)
    }

    pub fn health(&self) -> Result<TraySnapshot, String> {
        self.client.health().map_err(map_error)
    }

    pub fn setup_apply(&self, payload: &SetupRequestPayload) -> Result<SelfUseSetupState, String> {
        self.client.setup_apply(payload).map_err(map_error)
    }

    pub fn open_web_console(&self) -> Result<(), String> {
        self.client.open().map_err(map_error)
    }
}

fn map_error(error: TrayControlError) -> String {
    format_tray_error(&error)
}
