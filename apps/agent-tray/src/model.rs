use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum TrayState {
    SetupRequired,
    Starting,
    Ready,
    SwitchingEnvironment,
    BackendOffline,
    CrashLoop,
    Stopping,
    Error,
}

impl TrayState {
    #[must_use]
    pub const fn label(&self) -> &'static str {
        match self {
            Self::SetupRequired => "Setup required",
            Self::Starting => "Agent starting",
            Self::Ready => "Agent ready",
            Self::SwitchingEnvironment => "Switching environment",
            Self::BackendOffline => "Backend offline",
            Self::CrashLoop => "Agent restart paused",
            Self::Stopping => "Agent stopping",
            Self::Error => "Agent error",
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentSummary {
    pub id: String,
    pub label: String,
    pub active: bool,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TraySnapshot {
    pub state: TrayState,
    pub active_environment_id: Option<String>,
    pub environments: Vec<EnvironmentSummary>,
    pub detail: Option<String>,
    #[serde(default)]
    pub setup_required: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub deployment_origin: Option<String>,
}

impl Default for TraySnapshot {
    fn default() -> Self {
        Self {
            state: TrayState::Starting,
            active_environment_id: None,
            environments: Vec::new(),
            detail: None,
            setup_required: false,
            deployment_origin: None,
        }
    }
}

impl TraySnapshot {
    #[must_use]
    pub fn accessibility_label(&self) -> String {
        if self.state == TrayState::SetupRequired || self.setup_required {
            return format!("CthuTool — {}", self.state.label());
        }
        let environment = self
            .environments
            .iter()
            .find(|environment| environment.active)
            .map_or("No environment", |environment| environment.label.as_str());
        format!("CthuTool — {} — {environment}", self.state.label())
    }
}

#[cfg(test)]
mod tests {
    use super::{EnvironmentSummary, TraySnapshot, TrayState};

    #[test]
    fn accessibility_label_contains_state_and_environment() {
        let snapshot = TraySnapshot {
            state: TrayState::BackendOffline,
            active_environment_id: Some("prod".into()),
            environments: vec![EnvironmentSummary {
                active: true,
                id: "prod".into(),
                label: "Production".into(),
            }],
            detail: None,
            setup_required: false,
            deployment_origin: None,
        };

        assert_eq!(
            snapshot.accessibility_label(),
            "CthuTool — Backend offline — Production"
        );
    }

    #[test]
    fn setup_required_accessibility_omits_environment() {
        let snapshot = TraySnapshot {
            state: TrayState::SetupRequired,
            setup_required: true,
            ..TraySnapshot::default()
        };
        assert_eq!(snapshot.accessibility_label(), "CthuTool — Setup required");
        assert_eq!(TrayState::SetupRequired.label(), "Setup required");
    }
}
