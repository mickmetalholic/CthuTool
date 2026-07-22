use std::collections::HashMap;

use thiserror::Error;
use url::Url;

use crate::agent_control::AgentBridgeLaunch;

#[derive(Debug, Error, Eq, PartialEq)]
pub enum LaunchValidationError {
    #[error("launch URL is invalid")]
    InvalidUrl,
    #[error("launch URL must use HTTPS outside local development")]
    InsecureWebUrl,
    #[error("launch URL path must be /agent")]
    InvalidPath,
    #[error("launch fragment is incomplete or inconsistent")]
    InvalidFragment,
    #[error("launch ticket is expired")]
    ExpiredTicket,
}

#[must_use]
pub fn expires_at_epoch_millis(value: &str) -> Option<u64> {
    // Ticket freshness is ultimately enforced by the Agent. This compact parser
    // accepts millisecond epoch fixtures used by the native supervisor tests.
    value.strip_prefix("epoch-ms:")?.parse().ok()
}

pub fn validate_launch(
    launch: &AgentBridgeLaunch,
    expected_environment_id: &str,
    now_epoch_millis: Option<u64>,
) -> Result<Url, LaunchValidationError> {
    if let (Some(now), Some(expires_at)) = (
        now_epoch_millis,
        expires_at_epoch_millis(&launch.expires_at),
    ) && expires_at <= now
    {
        return Err(LaunchValidationError::ExpiredTicket);
    }
    let url = Url::parse(&launch.launch_url).map_err(|_| LaunchValidationError::InvalidUrl)?;
    let local_development = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "::1"));
    if url.scheme() != "https" && !(url.scheme() == "http" && local_development) {
        return Err(LaunchValidationError::InsecureWebUrl);
    }
    if url.path() != "/agent" {
        return Err(LaunchValidationError::InvalidPath);
    }
    if url.query().is_some() {
        return Err(LaunchValidationError::InvalidFragment);
    }
    let fragment = url
        .fragment()
        .ok_or(LaunchValidationError::InvalidFragment)?;
    let parameters: HashMap<_, _> = url::form_urlencoded::parse(fragment.as_bytes())
        .into_owned()
        .collect();
    let valid = parameters.len() == 4
        && parameters.get("endpoint") == Some(&launch.endpoint)
        && parameters.get("environment") == Some(&launch.environment_id)
        && parameters.get("environment").map(String::as_str) == Some(expected_environment_id)
        && parameters.get("instance") == Some(&launch.instance_id)
        && parameters
            .get("ticket")
            .is_some_and(|ticket| ticket.len() >= 32);
    if !valid {
        return Err(LaunchValidationError::InvalidFragment);
    }
    Ok(url)
}

pub trait BrowserOpener: Send + Sync {
    fn open(&self, url: &Url) -> Result<(), String>;
}

#[derive(Clone, Copy, Debug, Default)]
pub struct SystemBrowserOpener;

impl BrowserOpener for SystemBrowserOpener {
    fn open(&self, url: &Url) -> Result<(), String> {
        open::that(url.as_str()).map_err(|error| error.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::{LaunchValidationError, validate_launch};
    use crate::agent_control::AgentBridgeLaunch;

    fn launch(expires_at: &str) -> AgentBridgeLaunch {
        AgentBridgeLaunch {
            endpoint: "http://127.0.0.1:43123".into(),
            environment_id: "prod".into(),
            expires_at: expires_at.into(),
            instance_id: "instance-1".into(),
            launch_url: "https://app.example.com/agent#endpoint=http%3A%2F%2F127.0.0.1%3A43123&environment=prod&instance=instance-1&ticket=abcdefghijklmnopqrstuvwxyz123456".into(),
        }
    }

    #[test]
    fn accepts_only_exact_deployed_web_fragment_contract() {
        let url = validate_launch(&launch("2026-07-22T01:00:00.000Z"), "prod", None)
            .expect("valid launch");

        assert_eq!(
            url.origin().ascii_serialization(),
            "https://app.example.com"
        );
        assert!(url.query().is_none());
        assert!(url.fragment().is_some());
    }

    #[test]
    fn rejects_expired_ticket_fixture_before_opening_browser() {
        assert_eq!(
            validate_launch(&launch("epoch-ms:100"), "prod", Some(100)),
            Err(LaunchValidationError::ExpiredTicket)
        );
    }

    #[test]
    fn rejects_environment_mismatch_and_extra_fragment_fields() {
        assert_eq!(
            validate_launch(&launch("never-parsed"), "staging", None),
            Err(LaunchValidationError::InvalidFragment)
        );
        let mut extra = launch("never-parsed");
        extra.launch_url.push_str("&secret=persistent");
        assert_eq!(
            validate_launch(&extra, "prod", None),
            Err(LaunchValidationError::InvalidFragment)
        );
    }
}
