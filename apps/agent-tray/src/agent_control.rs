use std::{
    fs,
    io::{BufRead, BufReader, Read, Write},
    path::{Path, PathBuf},
    time::Duration,
};

use interprocess::local_socket::{GenericFilePath, Stream as LocalSocketStream, prelude::*};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use serde_json::Value;
use thiserror::Error;

use crate::model::EnvironmentSummary;

pub const AGENT_CONTROL_PROTOCOL_VERSION: u32 = 1;
const MAX_RESPONSE_BYTES: u64 = 64 * 1024;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentInstanceRecord {
    pub protocol_version: u32,
    pub pid: u32,
    pub nonce: String,
    pub control_endpoint: String,
    pub executable_path: PathBuf,
    pub entry_point: PathBuf,
    pub started_at: String,
}

impl AgentInstanceRecord {
    pub fn read(path: &Path) -> Result<Self, AgentControlError> {
        let record: Self = serde_json::from_slice(&fs::read(path)?)?;
        if record.protocol_version != AGENT_CONTROL_PROTOCOL_VERSION
            || record.pid == 0
            || record.nonce.is_empty()
            || record.control_endpoint.is_empty()
            || record.executable_path.as_os_str().is_empty()
            || record.entry_point.as_os_str().is_empty()
        {
            return Err(AgentControlError::InvalidRecord);
        }
        Ok(record)
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentHealth {
    pub application_version: String,
    pub protocol_version: u32,
    pub process: AgentProcessHealth,
    pub backend: AgentBackendHealth,
    pub environment: AgentEnvironmentHealth,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentProcessHealth {
    pub state: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentBackendHealth {
    pub status: String,
    pub last_error: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq)]
pub struct AgentEnvironmentHealth {
    pub id: Option<String>,
    pub label: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentBridgeLaunch {
    pub endpoint: String,
    pub environment_id: String,
    pub expires_at: String,
    pub instance_id: String,
    pub launch_url: String,
}

#[derive(Debug, Deserialize)]
struct EnvironmentList {
    environments: Vec<EnvironmentSummary>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SwitchResult {
    accepted: bool,
    environment_id: String,
}

#[derive(Debug, Deserialize)]
struct Accepted {
    accepted: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ControlEnvelope {
    ok: bool,
    protocol_version: u32,
    #[serde(default)]
    result: Value,
    error: Option<ControlFailure>,
}

#[derive(Debug, Deserialize)]
struct ControlFailure {
    code: String,
    message: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ControlRequest<'a> {
    protocol_version: u32,
    instance_nonce: &'a str,
    operation: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    environment_id: Option<&'a str>,
}

#[derive(Debug, Error)]
pub enum AgentControlError {
    #[error("Agent instance record is invalid")]
    InvalidRecord,
    #[error("Agent control protocol is incompatible")]
    IncompatibleProtocol,
    #[error("Agent control response is too large")]
    ResponseTooLarge,
    #[error("Agent control rejected {code}: {message}")]
    Rejected { code: String, message: String },
    #[error("Agent control response is invalid: {0}")]
    InvalidResponse(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

#[derive(Clone, Debug)]
pub struct AgentControlClient {
    record: AgentInstanceRecord,
    timeout: Duration,
}

impl AgentControlClient {
    #[must_use]
    pub fn new(record: AgentInstanceRecord) -> Self {
        Self {
            record,
            timeout: Duration::from_secs(2),
        }
    }

    #[must_use]
    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    pub fn health(&self) -> Result<AgentHealth, AgentControlError> {
        self.request("health", None)
    }

    pub fn environments(&self) -> Result<Vec<EnvironmentSummary>, AgentControlError> {
        self.request::<EnvironmentList>("environment.list", None)
            .map(|result| result.environments)
    }

    pub fn switch_environment(&self, environment_id: &str) -> Result<(), AgentControlError> {
        let result = self.request::<SwitchResult>("environment.switch", Some(environment_id))?;
        if result.accepted && result.environment_id == environment_id {
            Ok(())
        } else {
            Err(AgentControlError::InvalidResponse(
                "environment switch acknowledgement does not match".into(),
            ))
        }
    }

    pub fn issue_bridge_launch(&self) -> Result<AgentBridgeLaunch, AgentControlError> {
        self.request("bridge.launch", None)
    }

    pub fn shutdown(&self) -> Result<(), AgentControlError> {
        let result = self.request::<Accepted>("shutdown", None)?;
        if result.accepted {
            Ok(())
        } else {
            Err(AgentControlError::InvalidResponse(
                "shutdown was not accepted".into(),
            ))
        }
    }

    fn request<T: DeserializeOwned>(
        &self,
        operation: &str,
        environment_id: Option<&str>,
    ) -> Result<T, AgentControlError> {
        let name = Path::new(&self.record.control_endpoint).to_fs_name::<GenericFilePath>()?;
        let stream = LocalSocketStream::connect(name)?;
        stream.set_recv_timeout(Some(self.timeout))?;
        stream.set_send_timeout(Some(self.timeout))?;
        let mut reader = BufReader::new(stream);
        let request = ControlRequest {
            protocol_version: AGENT_CONTROL_PROTOCOL_VERSION,
            instance_nonce: &self.record.nonce,
            operation,
            environment_id,
        };
        serde_json::to_writer(reader.get_mut(), &request)?;
        reader.get_mut().write_all(b"\n")?;
        reader.get_mut().flush()?;

        let mut response = String::new();
        reader
            .by_ref()
            .take(MAX_RESPONSE_BYTES + 1)
            .read_line(&mut response)?;
        if response.len() as u64 > MAX_RESPONSE_BYTES {
            return Err(AgentControlError::ResponseTooLarge);
        }
        let envelope: ControlEnvelope = serde_json::from_str(response.trim_end())?;
        if envelope.protocol_version != AGENT_CONTROL_PROTOCOL_VERSION {
            return Err(AgentControlError::IncompatibleProtocol);
        }
        if !envelope.ok {
            let failure = envelope.error.unwrap_or(ControlFailure {
                code: "UNKNOWN".into(),
                message: "Agent control request failed".into(),
            });
            return Err(AgentControlError::Rejected {
                code: failure.code,
                message: failure.message,
            });
        }
        serde_json::from_value(envelope.result).map_err(AgentControlError::Json)
    }
}

#[cfg(test)]
mod tests {
    use super::{AGENT_CONTROL_PROTOCOL_VERSION, AgentInstanceRecord};
    use std::{fs, path::PathBuf};
    use uuid::Uuid;

    fn temporary_path() -> PathBuf {
        std::env::temp_dir().join(format!("cthutool-agent-record-{}", Uuid::new_v4()))
    }

    #[test]
    fn rejects_unversioned_or_incomplete_instance_record() {
        let path = temporary_path();
        fs::write(&path, r#"{"pid":12,"nonce":"nonce"}"#).expect("write fixture");

        assert!(AgentInstanceRecord::read(&path).is_err());
        let _ = fs::remove_file(path);
    }

    #[test]
    fn reads_versioned_agent_instance_record_without_persistent_credential() {
        let path = temporary_path();
        let json = format!(
            r#"{{"protocolVersion":{AGENT_CONTROL_PROTOCOL_VERSION},"pid":12,"nonce":"ephemeral-instance-nonce","controlEndpoint":"/tmp/agent.sock","executablePath":"/opt/cthutool/node","entryPoint":"/opt/cthutool/agent.js","startedAt":"2026-07-22T00:00:00.000Z"}}"#
        );
        fs::write(&path, json).expect("write fixture");

        let record = AgentInstanceRecord::read(&path).expect("valid record");
        assert_eq!(record.pid, 12);
        assert_eq!(record.nonce, "ephemeral-instance-nonce");
        assert!(
            !fs::read_to_string(&path)
                .expect("read fixture")
                .contains("credential")
        );
        let _ = fs::remove_file(path);
    }
}
