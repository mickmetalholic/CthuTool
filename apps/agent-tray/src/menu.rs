use crate::model::TraySnapshot;
use crate::self_use_config::SELF_USE_ENVIRONMENT_ID;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MenuEntry {
    Status {
        label: String,
    },
    ConfigureAgent,
    AgentSettings,
    OpenWebConsole,
    Environment {
        id: String,
        label: String,
        checked: bool,
    },
    Exit,
}

#[must_use]
pub fn build_menu_model(snapshot: &TraySnapshot) -> Vec<MenuEntry> {
    let mut entries = vec![MenuEntry::Status {
        label: snapshot.state.label().to_owned(),
    }];

    if snapshot.setup_required || snapshot.state == crate::model::TrayState::SetupRequired {
        entries.push(MenuEntry::ConfigureAgent);
        entries.push(MenuEntry::Exit);
        return entries;
    }

    entries.push(MenuEntry::AgentSettings);
    entries.push(MenuEntry::OpenWebConsole);
    if should_show_environment_list(snapshot) {
        entries.extend(
            snapshot
                .environments
                .iter()
                .map(|environment| MenuEntry::Environment {
                    checked: environment.active,
                    id: environment.id.clone(),
                    label: environment.label.clone(),
                }),
        );
    }
    entries.push(MenuEntry::Exit);
    entries
}

fn should_show_environment_list(snapshot: &TraySnapshot) -> bool {
    if snapshot.environments.len() <= 1 {
        return false;
    }
    !snapshot
        .environments
        .iter()
        .all(|environment| environment.id == SELF_USE_ENVIRONMENT_ID)
}

#[cfg(test)]
mod tests {
    use super::{MenuEntry, build_menu_model};
    use crate::model::{EnvironmentSummary, TraySnapshot, TrayState};

    #[test]
    fn setup_required_menu_is_configure_and_exit() {
        let model = build_menu_model(&TraySnapshot {
            state: TrayState::SetupRequired,
            setup_required: true,
            ..TraySnapshot::default()
        });
        assert_eq!(
            model,
            vec![
                MenuEntry::Status {
                    label: "Setup required".into(),
                },
                MenuEntry::ConfigureAgent,
                MenuEntry::Exit,
            ]
        );
    }

    #[test]
    fn configured_self_use_hides_environment_list() {
        let model = build_menu_model(&TraySnapshot {
            state: TrayState::Ready,
            active_environment_id: Some("self-use".into()),
            environments: vec![EnvironmentSummary {
                active: true,
                id: "self-use".into(),
                label: "Self-use".into(),
            }],
            detail: None,
            setup_required: false,
            deployment_origin: Some("https://app.example.com".into()),
        });
        assert!(model.contains(&MenuEntry::AgentSettings));
        assert!(model.contains(&MenuEntry::OpenWebConsole));
        assert!(model.contains(&MenuEntry::Exit));
        assert!(
            !model
                .iter()
                .any(|entry| matches!(entry, MenuEntry::Environment { .. }))
        );
        assert!(!model.contains(&MenuEntry::ConfigureAgent));
    }

    #[test]
    fn multi_environment_menu_keeps_radio_entries() {
        let model = build_menu_model(&TraySnapshot {
            state: TrayState::Ready,
            active_environment_id: Some("prod".into()),
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
            detail: None,
            setup_required: false,
            deployment_origin: None,
        });

        assert!(matches!(model.first(), Some(MenuEntry::Status { .. })));
        assert!(model.contains(&MenuEntry::OpenWebConsole));
        assert!(model.contains(&MenuEntry::Exit));
        assert_eq!(
            model
                .iter()
                .filter(|entry| matches!(entry, MenuEntry::Environment { checked: true, .. }))
                .count(),
            1
        );
        let rendered = format!("{model:?}");
        assert!(!rendered.contains("Pause"));
        assert!(!rendered.contains("Stop Tasks"));
        assert!(!rendered.contains("tray-only"));
    }
}
