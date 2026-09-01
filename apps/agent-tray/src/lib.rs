pub mod agent_control;
pub mod backoff;
pub mod icon;
pub mod instance;
pub mod launch;
pub mod menu;
pub mod model;
#[cfg(any(target_os = "macos", target_os = "windows"))]
pub mod native;
pub mod platform;
pub mod self_use_config;
pub mod supervisor;
pub mod tray_control;

pub const TRAY_CONTROL_PROTOCOL_VERSION: u32 = 1;
