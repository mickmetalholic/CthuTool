//! Pure setup-window state transitions and form validation.
//!
//! Kept free of Slint so unit tests can run without a display.

use cthutool_agent_tray::{
    model::TrayState,
    self_use_config::{
        DerivedEndpoints, OriginValidationOptions, SelfUseSetupState, derive_endpoints,
        validate_deployment_origin,
    },
    tray_control::SetupRequestPayload,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum UiMode {
    FirstRun,
    Settings,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ApplyPhase {
    Idle,
    Busy,
    Succeeded,
    Failed,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct EndpointsPreview {
    pub web_agent_url: String,
    pub backend_http_url: String,
    pub backend_agent_ws_url: String,
}

impl From<&DerivedEndpoints> for EndpointsPreview {
    fn from(value: &DerivedEndpoints) -> Self {
        Self {
            web_agent_url: value.web_agent_url.clone(),
            backend_http_url: value.backend_http_url.clone(),
            backend_agent_ws_url: value.backend_agent_ws_url.clone(),
        }
    }
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct FormErrors {
    pub origin: Option<String>,
    pub device_name: Option<String>,
}

impl FormErrors {
    #[must_use]
    pub fn has_errors(&self) -> bool {
        self.origin.is_some() || self.device_name.is_some()
    }
}

#[derive(Clone, Debug)]
pub struct SetupAppState {
    pub mode: UiMode,
    pub origin: String,
    pub device_name: String,
    pub connection_status: String,
    pub connection_detail: String,
    pub connection_enabled: bool,
    pub endpoints: EndpointsPreview,
    pub form_errors: FormErrors,
    pub action_error: Option<String>,
    pub apply_phase: ApplyPhase,
    pub setup_required: bool,
    pub show_about: bool,
}

impl SetupAppState {
    #[must_use]
    pub fn from_setup_state(
        setup: &SelfUseSetupState,
        connection_status: impl Into<String>,
        connection_detail: impl Into<String>,
        forced_mode: Option<UiMode>,
    ) -> Self {
        let mode = forced_mode.unwrap_or_else(|| classify_mode(setup));
        let endpoints = setup
            .endpoints
            .as_ref()
            .map(EndpointsPreview::from)
            .or_else(|| {
                setup
                    .deployment_origin
                    .as_deref()
                    .and_then(|origin| derive_endpoints_preview(origin).ok())
            })
            .unwrap_or_default();

        Self {
            mode,
            origin: setup.deployment_origin.clone().unwrap_or_default(),
            device_name: setup.device_name.clone(),
            connection_status: connection_status.into(),
            connection_detail: connection_detail.into(),
            connection_enabled: setup.connection_enabled,
            endpoints,
            form_errors: FormErrors::default(),
            action_error: None,
            apply_phase: ApplyPhase::Idle,
            setup_required: setup.setup_required,
            show_about: false,
        }
    }

    #[must_use]
    pub fn primary_action_label(&self) -> &'static str {
        match self.mode {
            UiMode::FirstRun => "Verify and connect",
            UiMode::Settings => "Save / Reconnect",
        }
    }

    #[must_use]
    pub fn is_busy(&self) -> bool {
        self.apply_phase == ApplyPhase::Busy
    }

    pub fn refresh_endpoint_preview(&mut self, options: OriginValidationOptions) {
        match derive_endpoints_preview_with_options(&self.origin, options) {
            Ok(preview) => {
                self.endpoints = preview;
                self.form_errors.origin = None;
            }
            Err(message) => {
                if self.origin.trim().is_empty() {
                    self.endpoints = EndpointsPreview::default();
                    self.form_errors.origin = None;
                } else {
                    self.form_errors.origin = Some(message);
                }
            }
        }
    }

    pub fn validate_current_form(&mut self, options: OriginValidationOptions) -> bool {
        self.form_errors = validate_form(&self.origin, options);
        self.action_error = None;
        !self.form_errors.has_errors()
    }

    #[must_use]
    pub fn build_apply_payload(&self) -> SetupRequestPayload {
        SetupRequestPayload {
            deployment_origin: Some(self.origin.trim().to_owned()),
            device_name: {
                let name = self.device_name.trim();
                if name.is_empty() {
                    None
                } else {
                    Some(name.to_owned())
                }
            },
            connection_enabled: Some(self.connection_enabled),
        }
    }

    pub fn begin_apply(&mut self) {
        self.apply_phase = ApplyPhase::Busy;
        self.action_error = None;
    }

    pub fn apply_succeeded(&mut self, setup: &SelfUseSetupState, connection_status: &str) {
        self.origin = setup.deployment_origin.clone().unwrap_or_default();
        self.device_name = setup.device_name.clone();
        self.connection_enabled = setup.connection_enabled;
        self.setup_required = setup.setup_required;
        self.endpoints = setup
            .endpoints
            .as_ref()
            .map(EndpointsPreview::from)
            .unwrap_or_default();
        self.connection_status = connection_status.to_owned();
        self.connection_detail.clear();
        self.form_errors = FormErrors::default();
        self.action_error = None;
        self.apply_phase = ApplyPhase::Succeeded;
        if !setup.setup_required {
            self.mode = UiMode::Settings;
        }
    }

    pub fn apply_failed(&mut self, message: impl Into<String>) {
        self.apply_phase = ApplyPhase::Failed;
        self.action_error = Some(message.into());
        // Keep the in-memory candidate so the user can retry without retyping.
    }

    /// Cancel leaves setup required; does not clear tray config.
    pub fn cancel_first_run(&mut self) -> bool {
        if self.mode != UiMode::FirstRun {
            return false;
        }
        self.setup_required = true;
        self.apply_phase = ApplyPhase::Idle;
        self.action_error = None;
        true
    }

    pub fn set_about_visible(&mut self, visible: bool) {
        self.show_about = visible;
    }

    pub fn set_action_error(&mut self, message: impl Into<String>) {
        self.action_error = Some(message.into());
        self.apply_phase = ApplyPhase::Failed;
    }
}

#[must_use]
pub fn classify_mode(setup: &SelfUseSetupState) -> UiMode {
    if setup.setup_required || setup.deployment_origin.is_none() {
        UiMode::FirstRun
    } else {
        UiMode::Settings
    }
}

#[must_use]
pub fn connection_status_label(state: &TrayState) -> &'static str {
    state.label()
}

pub fn derive_endpoints_preview(origin: &str) -> Result<EndpointsPreview, String> {
    derive_endpoints_preview_with_options(origin, OriginValidationOptions::from_env())
}

pub fn derive_endpoints_preview_with_options(
    origin: &str,
    options: OriginValidationOptions,
) -> Result<EndpointsPreview, String> {
    derive_endpoints(origin, options)
        .map(|endpoints| EndpointsPreview::from(&endpoints))
        .map_err(|error| error.to_string())
}

#[must_use]
pub fn validate_form(origin: &str, options: OriginValidationOptions) -> FormErrors {
    let mut errors = FormErrors::default();

    match validate_deployment_origin(origin, options) {
        Ok(_) => {}
        Err(error) => errors.origin = Some(error.to_string()),
    }

    errors
}

#[must_use]
pub fn format_tray_error(error: &impl std::fmt::Display) -> String {
    let message = error.to_string();
    if message.contains("tray control request was rejected") {
        format!(
            "The Agent tray rejected this request. {message} Start or restart the tray, then try again."
        )
    } else if message.contains("No such file")
        || message.contains("Connection refused")
        || message.contains("os error 2")
        || message.contains("os error 61")
    {
        "Cannot reach the Agent tray. Make sure CthuTool Agent is running, then reopen Settings."
            .into()
    } else {
        format!("Tray communication failed: {message}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cthutool_agent_tray::self_use_config::DerivedEndpoints;

    fn sample_setup(setup_required: bool) -> SelfUseSetupState {
        SelfUseSetupState {
            configured: !setup_required,
            setup_required,
            deployment_origin: if setup_required {
                None
            } else {
                Some("https://example.com".into())
            },
            endpoints: if setup_required {
                None
            } else {
                Some(DerivedEndpoints {
                    web_origin: "https://example.com".into(),
                    web_agent_url: "https://example.com/agent".into(),
                    backend_http_url: "https://example.com".into(),
                    backend_agent_ws_url: "wss://example.com/ws/agents".into(),
                    environment_id: "self-use".into(),
                    namespace: "self-use".into(),
                    label: "Self-use".into(),
                    trust: "release".into(),
                })
            },
            device_name: "desk".into(),
            connection_enabled: true,
            agent_id: "agent-1".into(),
            browser_executable_path: None,
        }
    }

    #[test]
    fn classify_mode_first_run_when_setup_required() {
        assert_eq!(classify_mode(&sample_setup(true)), UiMode::FirstRun);
        assert_eq!(classify_mode(&sample_setup(false)), UiMode::Settings);
    }

    #[test]
    fn derive_endpoints_preview_for_https_origin() {
        let preview = derive_endpoints_preview_with_options(
            "https://deploy.example",
            OriginValidationOptions::default(),
        )
        .expect("valid origin");
        assert_eq!(preview.web_agent_url, "https://deploy.example/agent");
        assert_eq!(preview.backend_http_url, "https://deploy.example");
        assert_eq!(
            preview.backend_agent_ws_url,
            "wss://deploy.example/ws/agents"
        );
    }

    #[test]
    fn validate_form_rejects_invalid_origin() {
        let errors = validate_form(
            "http://example.com/path",
            OriginValidationOptions::default(),
        );
        assert!(errors.origin.is_some());
    }

    #[test]
    fn validate_form_accepts_exact_https_origin() {
        let errors = validate_form("https://example.com", OriginValidationOptions::default());
        assert!(!errors.has_errors());
    }

    #[test]
    fn cancel_leaves_setup_required() {
        let mut state =
            SetupAppState::from_setup_state(&sample_setup(true), "Setup required", "", None);
        assert!(state.cancel_first_run());
        assert!(state.setup_required);
        assert_eq!(state.apply_phase, ApplyPhase::Idle);
    }

    #[test]
    fn apply_success_clears_candidate_and_switches_to_settings() {
        let mut state =
            SetupAppState::from_setup_state(&sample_setup(true), "Setup required", "", None);
        state.begin_apply();
        state.apply_succeeded(&sample_setup(false), "Agent ready");
        assert_eq!(state.mode, UiMode::Settings);
        assert_eq!(state.apply_phase, ApplyPhase::Succeeded);
        assert!(!state.setup_required);
    }

    #[test]
    fn apply_failure_keeps_origin_for_retry() {
        let mut state =
            SetupAppState::from_setup_state(&sample_setup(true), "Setup required", "", None);
        state.origin = "https://example.com".into();
        state.begin_apply();
        state.apply_failed("Backend offline");
        assert_eq!(state.origin, "https://example.com");
        assert_eq!(state.apply_phase, ApplyPhase::Failed);
        assert_eq!(state.action_error.as_deref(), Some("Backend offline"));
    }

    #[test]
    fn build_apply_payload_contains_normalized_origin() {
        let mut state =
            SetupAppState::from_setup_state(&sample_setup(false), "Agent ready", "", None);
        state.origin = "https://example.com".into();
        let payload = state.build_apply_payload();
        assert_eq!(
            payload.deployment_origin.as_deref(),
            Some("https://example.com")
        );
    }

    #[test]
    fn format_tray_error_is_actionable_when_tray_missing() {
        let message = format_tray_error(&std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            "Connection refused",
        ));
        assert!(message.contains("Cannot reach the Agent tray"));
    }
}
