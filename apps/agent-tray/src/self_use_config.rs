#[cfg(windows)]
use std::process::Command;
use std::{
    env, fs,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use thiserror::Error;
use url::Url;
use uuid::Uuid;

pub const SELF_USE_CONFIG_SCHEMA_VERSION: u32 = 1;
pub const SELF_USE_ENVIRONMENT_ID: &str = "self-use";
pub const SELF_USE_NAMESPACE: &str = "self-use";
pub const SELF_USE_LABEL: &str = "Self-use";

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserRuntime {
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub executable_path: Option<String>,
}

impl Default for BrowserRuntime {
    fn default() -> Self {
        Self {
            kind: "host-chrome".into(),
            executable_path: None,
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelfUseConfig {
    pub schema_version: u32,
    pub agent_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deployment_origin: Option<String>,
    pub device_name: String,
    pub connection_enabled: bool,
    pub browser_runtime: BrowserRuntime,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DerivedEndpoints {
    pub web_origin: String,
    pub web_agent_url: String,
    pub backend_http_url: String,
    pub backend_agent_ws_url: String,
    pub environment_id: String,
    pub namespace: String,
    pub label: String,
    pub trust: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelfUseSetupState {
    pub configured: bool,
    pub setup_required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deployment_origin: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpoints: Option<DerivedEndpoints>,
    pub device_name: String,
    pub connection_enabled: bool,
    pub agent_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub browser_executable_path: Option<String>,
}

#[derive(Clone, Debug, Default)]
pub struct SelfUseCandidate {
    pub deployment_origin: String,
    pub device_name: Option<String>,
    pub connection_enabled: Option<bool>,
}

#[derive(Clone, Debug)]
pub struct PreparedCandidate {
    pub config: SelfUseConfig,
    pub endpoints: DerivedEndpoints,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct OriginValidationOptions {
    pub allow_development_localhost: bool,
}

impl OriginValidationOptions {
    #[must_use]
    pub fn from_env() -> Self {
        Self {
            allow_development_localhost: env::var_os("CTHUTOOL_ALLOW_DEV_LOCALHOST").is_some(),
        }
    }
}

#[derive(Debug, Error)]
pub enum SelfUseConfigError {
    #[error("deploymentOrigin must be a non-empty exact Origin")]
    EmptyOrigin,
    #[error("deploymentOrigin must be a valid absolute URL")]
    InvalidUrl,
    #[error("deploymentOrigin must be an exact Origin without path, query, or hash")]
    NotExactOrigin,
    #[error("deploymentOrigin must use https")]
    RequiresHttps,
    #[error("deploymentOrigin must use https or http://localhost")]
    RequiresHttpsOrLocalhost,
    #[error("candidate Backend verification failed: {0}")]
    BackendVerification(String),
    #[error("self-use configuration persistence failed: {0}")]
    Persistence(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

impl SelfUseConfigError {
    #[must_use]
    pub const fn code(&self) -> &'static str {
        match self {
            Self::EmptyOrigin
            | Self::InvalidUrl
            | Self::NotExactOrigin
            | Self::RequiresHttps
            | Self::RequiresHttpsOrLocalhost => "INVALID_ORIGIN",
            Self::BackendVerification(_) => "BACKEND_VERIFICATION_FAILED",
            Self::Persistence(_) | Self::Io(_) | Self::Json(_) => "PERSISTENCE_FAILED",
        }
    }
}

#[must_use]
pub fn config_path(user_data_dir: &Path) -> PathBuf {
    user_data_dir.join("config.json")
}

pub fn validate_deployment_origin(
    input: &str,
    options: OriginValidationOptions,
) -> Result<String, SelfUseConfigError> {
    let value = normalize_text(Some(input)).ok_or(SelfUseConfigError::EmptyOrigin)?;
    let url = Url::parse(&value).map_err(|_| SelfUseConfigError::InvalidUrl)?;
    if value != url.origin().ascii_serialization() {
        return Err(SelfUseConfigError::NotExactOrigin);
    }
    let allow_localhost =
        options.allow_development_localhost && is_localhost_hostname(url.host_str());
    match url.scheme() {
        "https" => Ok(value),
        "http" if allow_localhost => Ok(value),
        _ if allow_localhost => Err(SelfUseConfigError::RequiresHttpsOrLocalhost),
        _ => Err(SelfUseConfigError::RequiresHttps),
    }
}

pub fn derive_endpoints(
    deployment_origin: &str,
    options: OriginValidationOptions,
) -> Result<DerivedEndpoints, SelfUseConfigError> {
    let origin = validate_deployment_origin(deployment_origin, options)?;
    let url = Url::parse(&origin).map_err(|_| SelfUseConfigError::InvalidUrl)?;
    let trust = if options.allow_development_localhost && is_localhost_hostname(url.host_str()) {
        "custom-development"
    } else {
        "release"
    };
    let mut ws = url.clone();
    ws.set_scheme(if url.scheme() == "https" { "wss" } else { "ws" })
        .map_err(|()| SelfUseConfigError::InvalidUrl)?;
    ws.set_path("/ws/agents");
    let mut agent = url.clone();
    agent.set_path("/agent");
    Ok(DerivedEndpoints {
        web_origin: origin.clone(),
        web_agent_url: trim_trailing_slash(agent.as_str()),
        backend_http_url: origin,
        backend_agent_ws_url: trim_trailing_slash(ws.as_str()),
        environment_id: SELF_USE_ENVIRONMENT_ID.into(),
        namespace: SELF_USE_NAMESPACE.into(),
        label: SELF_USE_LABEL.into(),
        trust: trust.into(),
    })
}

pub fn normalize_config(
    input: Option<&SelfUseConfig>,
    options: OriginValidationOptions,
) -> Result<SelfUseConfig, SelfUseConfigError> {
    let deployment_origin = match input.and_then(|config| config.deployment_origin.as_deref()) {
        Some(origin) if !origin.trim().is_empty() => {
            Some(validate_deployment_origin(origin, options)?)
        }
        _ => None,
    };
    Ok(SelfUseConfig {
        schema_version: SELF_USE_CONFIG_SCHEMA_VERSION,
        agent_id: input
            .map(|config| config.agent_id.clone())
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(|| format!("agent-{}", Uuid::new_v4())),
        deployment_origin,
        device_name: input
            .map(|config| config.device_name.clone())
            .filter(|value| !value.trim().is_empty())
            .unwrap_or_else(default_device_name),
        connection_enabled: input.is_none_or(|config| config.connection_enabled),
        browser_runtime: input
            .map(|config| normalize_browser_runtime(&config.browser_runtime))
            .unwrap_or_default(),
    })
}

pub fn read_config(
    user_data_dir: &Path,
    options: OriginValidationOptions,
) -> Result<Option<SelfUseConfig>, SelfUseConfigError> {
    let path = config_path(user_data_dir);
    if !path.exists() {
        return Ok(None);
    }
    let raw: serde_json::Value = serde_json::from_str(&fs::read_to_string(path)?)?;
    if raw
        .get("schemaVersion")
        .and_then(serde_json::Value::as_u64)
        .is_none()
    {
        return Ok(None);
    }
    let parsed: SelfUseConfig = serde_json::from_value(raw)?;
    Ok(Some(normalize_config(Some(&parsed), options)?))
}

pub fn write_config(
    user_data_dir: &Path,
    config: &SelfUseConfig,
    options: OriginValidationOptions,
) -> Result<SelfUseConfig, SelfUseConfigError> {
    let normalized = normalize_config(Some(config), options)?;
    atomic_write_json(
        &config_path(user_data_dir),
        &redact_config_for_persistence(&normalized),
    )?;
    Ok(normalized)
}

#[must_use]
pub fn is_configured(user_data_dir: &Path, options: OriginValidationOptions) -> bool {
    let Ok(Some(config)) = read_config(user_data_dir, options) else {
        return false;
    };
    let Some(origin) = config.deployment_origin.as_deref() else {
        return false;
    };
    validate_deployment_origin(origin, options).is_ok()
}

pub fn get_setup_state(
    user_data_dir: &Path,
    options: OriginValidationOptions,
) -> Result<SelfUseSetupState, SelfUseConfigError> {
    // A malformed/old config must not prevent the native settings window from
    // opening. Treat it as recoverable SetupRequired state and let apply
    // replace it with a valid versioned config.
    let config = match read_config(user_data_dir, options).ok().flatten() {
        Some(config) => config,
        None => normalize_config(None, options)?,
    };
    let configured = is_configured(user_data_dir, options);
    let endpoints = config
        .deployment_origin
        .as_deref()
        .and_then(|origin| derive_endpoints(origin, options).ok());
    Ok(SelfUseSetupState {
        configured,
        setup_required: !configured,
        deployment_origin: config.deployment_origin.clone(),
        endpoints,
        device_name: config.device_name,
        connection_enabled: config.connection_enabled,
        agent_id: config.agent_id,
        browser_executable_path: config.browser_runtime.executable_path,
    })
}

pub fn validate_candidate(
    candidate: &SelfUseCandidate,
    options: OriginValidationOptions,
) -> Result<DerivedEndpoints, SelfUseConfigError> {
    derive_endpoints(&candidate.deployment_origin, options)
}

pub fn prepare_candidate(
    user_data_dir: &Path,
    candidate: &SelfUseCandidate,
    options: OriginValidationOptions,
) -> Result<PreparedCandidate, SelfUseConfigError> {
    let previous_config = match read_config(user_data_dir, options).ok().flatten() {
        Some(config) => config,
        None => normalize_config(None, options)?,
    };
    let origin = validate_deployment_origin(&candidate.deployment_origin, options)?;
    let endpoints = derive_endpoints(&origin, options)?;
    let config = SelfUseConfig {
        schema_version: SELF_USE_CONFIG_SCHEMA_VERSION,
        agent_id: previous_config.agent_id,
        deployment_origin: Some(origin),
        device_name: candidate
            .device_name
            .clone()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or(previous_config.device_name),
        connection_enabled: candidate
            .connection_enabled
            .unwrap_or(previous_config.connection_enabled),
        browser_runtime: previous_config.browser_runtime,
    };
    Ok(PreparedCandidate { config, endpoints })
}

pub fn apply_candidate(
    user_data_dir: &Path,
    candidate: &SelfUseCandidate,
    options: OriginValidationOptions,
) -> Result<(SelfUseConfig, DerivedEndpoints), SelfUseConfigError> {
    let previous_config = match read_config(user_data_dir, options).ok().flatten() {
        Some(config) => config,
        None => normalize_config(None, options)?,
    };
    let prepared = prepare_candidate(user_data_dir, candidate, options)?;

    let applied = (|| {
        let written = write_config(user_data_dir, &prepared.config, options)?;
        write_selection(user_data_dir)?;
        Ok(written)
    })();

    match applied {
        Ok(config) => Ok((config, prepared.endpoints)),
        Err(error) => {
            restore_known_good(user_data_dir, &previous_config, options);
            Err(error)
        }
    }
}

#[must_use]
pub fn redact_config_for_persistence(config: &SelfUseConfig) -> serde_json::Value {
    let mut map = serde_json::Map::new();
    map.insert(
        "schemaVersion".into(),
        serde_json::json!(SELF_USE_CONFIG_SCHEMA_VERSION),
    );
    map.insert("agentId".into(), serde_json::json!(config.agent_id));
    if let Some(origin) = &config.deployment_origin {
        map.insert("deploymentOrigin".into(), serde_json::json!(origin));
    }
    map.insert("deviceName".into(), serde_json::json!(config.device_name));
    map.insert(
        "connectionEnabled".into(),
        serde_json::json!(config.connection_enabled),
    );
    map.insert(
        "browserRuntime".into(),
        serde_json::to_value(&config.browser_runtime).unwrap_or_else(|_| serde_json::json!({})),
    );
    serde_json::Value::Object(map)
}

#[must_use]
pub fn redact_config_for_log(config: &SelfUseConfig) -> serde_json::Value {
    redact_config_for_persistence(config)
}

#[must_use]
pub fn redact_setup_state(state: &SelfUseSetupState) -> serde_json::Value {
    serde_json::to_value(state).unwrap_or_else(|_| serde_json::json!({}))
}

fn write_selection(user_data_dir: &Path) -> Result<(), SelfUseConfigError> {
    atomic_write_json(
        &user_data_dir.join("environment.json"),
        &serde_json::json!({ "activeEnvironmentId": SELF_USE_ENVIRONMENT_ID }),
    )
}

pub fn restore_known_good(
    user_data_dir: &Path,
    previous_config: &SelfUseConfig,
    options: OriginValidationOptions,
) {
    let _ = write_config(user_data_dir, previous_config, options);
}

fn normalize_browser_runtime(input: &BrowserRuntime) -> BrowserRuntime {
    let executable_path = normalize_text(input.executable_path.as_deref());
    BrowserRuntime {
        kind: "host-chrome".into(),
        executable_path,
    }
}

fn normalize_text(input: Option<&str>) -> Option<String> {
    input
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

fn is_localhost_hostname(hostname: Option<&str>) -> bool {
    matches!(hostname, Some("localhost" | "127.0.0.1" | "::1"))
}

fn default_device_name() -> String {
    env::var("COMPUTERNAME")
        .or_else(|_| env::var("HOSTNAME"))
        .unwrap_or_else(|_| "cthutool-agent".into())
}

fn trim_trailing_slash(value: &str) -> String {
    value.trim_end_matches('/').to_owned()
}

fn atomic_write_json(path: &Path, value: &serde_json::Value) -> Result<(), SelfUseConfigError> {
    let body = format!("{}\n", serde_json::to_string_pretty(value)?);
    atomic_write(path, &body, 0o600)
}

fn atomic_write(path: &Path, value: &str, mode: u32) -> Result<(), SelfUseConfigError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(parent, fs::Permissions::from_mode(0o700));
        }
        #[cfg(windows)]
        protect_windows_path(parent)?;
    }
    let temporary = path.with_extension(format!(
        "{}.{}.tmp",
        std::process::id(),
        Uuid::new_v4().simple()
    ));
    fs::write(&temporary, value)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&temporary, fs::Permissions::from_mode(mode));
    }
    #[cfg(windows)]
    protect_windows_path(&temporary)?;
    #[cfg(not(any(unix, windows)))]
    let _ = mode;
    #[cfg(windows)]
    let _ = mode;
    if let Err(error) = replace_file(&temporary, path) {
        let _ = fs::remove_file(&temporary);
        return Err(SelfUseConfigError::Persistence(error.to_string()));
    }
    Ok(())
}

fn replace_file(temporary: &Path, path: &Path) -> std::io::Result<()> {
    #[cfg(windows)]
    {
        match fs::rename(temporary, path) {
            Ok(()) => Ok(()),
            Err(error)
                if matches!(
                    error.kind(),
                    std::io::ErrorKind::AlreadyExists | std::io::ErrorKind::PermissionDenied
                ) =>
            {
                match fs::remove_file(path) {
                    Ok(()) => {}
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                    Err(error) => return Err(error),
                }
                fs::rename(temporary, path)
            }
            Err(error) => Err(error),
        }
    }
    #[cfg(not(windows))]
    {
        fs::rename(temporary, path)
    }
}

#[cfg(windows)]
fn protect_windows_path(path: &Path) -> Result<(), SelfUseConfigError> {
    let username = env::var("USERNAME")
        .map_err(|_| SelfUseConfigError::Persistence("Windows user is unavailable".into()))?;
    let identity = env::var("USERDOMAIN")
        .map(|domain| format!(r#"{domain}\{username}"#))
        .unwrap_or(username);
    let status = Command::new("icacls.exe")
        .args([
            path.as_os_str(),
            std::ffi::OsStr::new("/inheritance:r"),
            std::ffi::OsStr::new("/grant:r"),
        ])
        .arg(format!("{identity}:F"))
        .status()
        .map_err(|error| SelfUseConfigError::Persistence(error.to_string()))?;
    if status.success() {
        Ok(())
    } else {
        Err(SelfUseConfigError::Persistence(
            "Unable to protect self-use storage with a user-only Windows ACL".into(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::{
        OriginValidationOptions, SelfUseCandidate, apply_candidate, derive_endpoints,
        is_configured, read_config, redact_config_for_log, redact_config_for_persistence,
        validate_deployment_origin, write_config,
    };
    use std::fs;
    use uuid::Uuid;

    fn temp_root() -> std::path::PathBuf {
        let root = std::env::temp_dir().join(format!("cta-self-use-{}", Uuid::new_v4()));
        fs::create_dir_all(&root).expect("temp root");
        root
    }

    #[test]
    fn validates_exact_origin_and_derives_endpoints() {
        assert_eq!(
            validate_deployment_origin(
                "https://app.example.com",
                OriginValidationOptions::default()
            )
            .expect("https origin"),
            "https://app.example.com"
        );
        assert!(
            validate_deployment_origin(
                "https://app.example.com/agent",
                OriginValidationOptions::default()
            )
            .is_err()
        );
        assert!(
            validate_deployment_origin(
                "http://app.example.com",
                OriginValidationOptions::default()
            )
            .is_err()
        );
        assert!(
            validate_deployment_origin(
                "https://app.example.com?x=1",
                OriginValidationOptions::default()
            )
            .is_err()
        );
        assert_eq!(
            validate_deployment_origin(
                "http://localhost:5173",
                OriginValidationOptions {
                    allow_development_localhost: true,
                }
            )
            .expect("localhost"),
            "http://localhost:5173"
        );

        let endpoints = derive_endpoints(
            "https://app.example.com",
            OriginValidationOptions::default(),
        )
        .expect("derive");
        assert_eq!(endpoints.web_origin, "https://app.example.com");
        assert_eq!(endpoints.web_agent_url, "https://app.example.com/agent");
        assert_eq!(endpoints.backend_http_url, "https://app.example.com");
        assert_eq!(
            endpoints.backend_agent_ws_url,
            "wss://app.example.com/ws/agents"
        );
        assert_eq!(endpoints.environment_id, "self-use");
        assert_eq!(endpoints.namespace, "self-use");
    }

    #[test]
    fn writes_config_atomically_without_secret_fields() {
        let root = temp_root();
        let written = write_config(
            &root,
            &super::SelfUseConfig {
                schema_version: 1,
                agent_id: "agent-1".into(),
                deployment_origin: Some("https://app.example.com".into()),
                device_name: "Desk".into(),
                connection_enabled: true,
                browser_runtime: super::BrowserRuntime::default(),
            },
            OriginValidationOptions::default(),
        )
        .expect("write config");
        let legacy_secret_path = root
            .join("environments")
            .join(super::SELF_USE_NAMESPACE)
            .join("agent-secret");
        fs::create_dir_all(legacy_secret_path.parent().expect("legacy secret parent"))
            .expect("create legacy secret parent");
        fs::write(&legacy_secret_path, "legacy-secret-must-remain\n").expect("write legacy secret");

        let persisted: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(root.join("config.json")).expect("read"))
                .expect("json");
        assert_eq!(persisted["schemaVersion"], 1);
        assert_eq!(persisted["deploymentOrigin"], "https://app.example.com");
        assert!(persisted.get("agentSecret").is_none());
        assert!(
            redact_config_for_persistence(&written)
                .get("agentSecret")
                .is_none()
        );
        assert!(redact_config_for_log(&written).get("secret").is_none());
        assert_eq!(
            fs::read_to_string(legacy_secret_path).expect("legacy secret file"),
            "legacy-secret-must-remain\n"
        );
        assert!(is_configured(&root, OriginValidationOptions::default()));
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn rolls_back_when_candidate_apply_fails() {
        let root = temp_root();
        apply_candidate(
            &root,
            &SelfUseCandidate {
                deployment_origin: "https://good.example.com".into(),
                device_name: Some("Good".into()),
                connection_enabled: Some(true),
            },
            OriginValidationOptions::default(),
        )
        .expect("good apply");

        assert!(
            apply_candidate(
                &root,
                &SelfUseCandidate {
                    deployment_origin: "https://bad.example.com/path".into(),
                    device_name: None,
                    connection_enabled: None,
                },
                OriginValidationOptions::default(),
            )
            .is_err()
        );

        assert_eq!(
            read_config(&root, OriginValidationOptions::default())
                .expect("read")
                .expect("config")
                .deployment_origin
                .as_deref(),
            Some("https://good.example.com")
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn malformed_config_is_recoverable_setup_state() {
        let root = temp_root();
        fs::write(root.join("config.json"), b"{malformed json").expect("write malformed config");

        let state =
            super::get_setup_state(&root, OriginValidationOptions::default()).expect("setup state");

        assert!(state.setup_required);
        assert!(!state.configured);
        let _ = fs::remove_dir_all(root);
    }
}
