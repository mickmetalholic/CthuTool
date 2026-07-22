use crate::model::{EnvironmentSummary, TraySnapshot};

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MenuEntry {
    Status {
        label: String,
    },
    Open,
    Environment {
        id: String,
        label: String,
        checked: bool,
    },
    Exit,
}

#[must_use]
pub fn build_menu_model(snapshot: &TraySnapshot) -> Vec<MenuEntry> {
    let mut entries = vec![
        MenuEntry::Status {
            label: snapshot.state.label().to_owned(),
        },
        MenuEntry::Open,
    ];
    entries.extend(snapshot.environments.iter().map(environment_entry));
    entries.push(MenuEntry::Exit);
    entries
}

fn environment_entry(environment: &EnvironmentSummary) -> MenuEntry {
    MenuEntry::Environment {
        checked: environment.active,
        id: environment.id.clone(),
        label: environment.label.clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::{MenuEntry, build_menu_model};
    use crate::model::{EnvironmentSummary, TraySnapshot, TrayState};

    #[test]
    fn menu_is_intentionally_minimal_and_radio_style() {
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
        });

        assert!(matches!(model.first(), Some(MenuEntry::Status { .. })));
        assert!(model.contains(&MenuEntry::Open));
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
