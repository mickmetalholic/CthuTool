use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use sysinfo::{Pid, ProcessesToUpdate, System};
use thiserror::Error;
use uuid::Uuid;

use crate::TRAY_CONTROL_PROTOCOL_VERSION;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrayInstanceRecord {
    pub protocol_version: u32,
    pub pid: u32,
    pub nonce: String,
    pub control_endpoint: String,
    pub executable_path: PathBuf,
    pub process_started_at: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProcessIdentity {
    pub pid: u32,
    pub executable_path: PathBuf,
    pub process_started_at: u64,
}

pub trait ProcessInspector {
    fn inspect(&self, pid: u32) -> Option<ProcessIdentity>;
}

#[derive(Clone, Copy, Debug, Default)]
pub struct SystemProcessInspector;

impl ProcessInspector for SystemProcessInspector {
    fn inspect(&self, pid: u32) -> Option<ProcessIdentity> {
        let pid = Pid::from_u32(pid);
        let mut system = System::new();
        system.refresh_processes(ProcessesToUpdate::Some(&[pid]), true);
        let process = system.process(pid)?;
        Some(ProcessIdentity {
            pid: pid.as_u32(),
            executable_path: process.exe()?.to_path_buf(),
            process_started_at: process.start_time(),
        })
    }
}

#[derive(Debug, Error)]
pub enum InstanceError {
    #[error("tray instance record is invalid")]
    InvalidRecord,
    #[error("tray instance identity did not match the live process")]
    IdentityMismatch,
    #[error("tray instance control handshake failed")]
    HandshakeFailed,
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

#[derive(Clone, Debug)]
pub struct InstanceRegistry {
    path: PathBuf,
}

impl InstanceRegistry {
    #[must_use]
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn create_record(
        &self,
        control_endpoint: String,
        inspector: &impl ProcessInspector,
    ) -> Result<TrayInstanceRecord, InstanceError> {
        let pid = std::process::id();
        let identity = inspector
            .inspect(pid)
            .ok_or(InstanceError::IdentityMismatch)?;
        Ok(TrayInstanceRecord {
            protocol_version: TRAY_CONTROL_PROTOCOL_VERSION,
            pid,
            nonce: Uuid::new_v4().to_string(),
            control_endpoint,
            executable_path: canonical_or_original(&identity.executable_path),
            process_started_at: identity.process_started_at,
        })
    }

    pub fn read(&self) -> Result<TrayInstanceRecord, InstanceError> {
        let record: TrayInstanceRecord = serde_json::from_slice(&fs::read(&self.path)?)?;
        if !record.is_well_formed() {
            return Err(InstanceError::InvalidRecord);
        }
        Ok(record)
    }

    pub fn write(&self, record: &TrayInstanceRecord) -> Result<(), InstanceError> {
        if !record.is_well_formed() {
            return Err(InstanceError::InvalidRecord);
        }
        let parent = self.path.parent().ok_or(InstanceError::InvalidRecord)?;
        fs::create_dir_all(parent)?;
        set_private_directory(parent)?;
        let temporary = self.path.with_extension(format!("tmp-{}", Uuid::new_v4()));
        let mut output = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)?;
        set_private_file(&temporary)?;
        output.write_all(&serde_json::to_vec_pretty(record)?)?;
        output.write_all(b"\n")?;
        output.sync_all()?;
        fs::rename(&temporary, &self.path)?;
        Ok(())
    }

    pub fn remove_if_owned(&self, owned: &TrayInstanceRecord) -> Result<bool, InstanceError> {
        let Ok(current) = self.read() else {
            return Ok(false);
        };
        if current == *owned {
            fs::remove_file(&self.path)?;
            return Ok(true);
        }
        Ok(false)
    }

    pub fn recover_stale(
        &self,
        inspector: &impl ProcessInspector,
        handshake: impl FnOnce(&TrayInstanceRecord) -> bool,
    ) -> Result<bool, InstanceError> {
        let Ok(record) = self.read() else {
            if self.path.exists() {
                fs::remove_file(&self.path)?;
                return Ok(true);
            }
            return Ok(false);
        };
        if validate_live_identity(&record, inspector).is_ok() && handshake(&record) {
            return Ok(false);
        }
        fs::remove_file(&self.path)?;
        Ok(true)
    }
}

impl TrayInstanceRecord {
    #[must_use]
    pub fn is_well_formed(&self) -> bool {
        self.protocol_version == TRAY_CONTROL_PROTOCOL_VERSION
            && self.pid > 0
            && !self.nonce.is_empty()
            && !self.control_endpoint.is_empty()
            && !self.executable_path.as_os_str().is_empty()
            && self.process_started_at > 0
    }
}

pub fn validate_live_identity(
    record: &TrayInstanceRecord,
    inspector: &impl ProcessInspector,
) -> Result<ProcessIdentity, InstanceError> {
    if !record.is_well_formed() {
        return Err(InstanceError::InvalidRecord);
    }
    let live = inspector
        .inspect(record.pid)
        .ok_or(InstanceError::IdentityMismatch)?;
    if live.pid == record.pid
        && canonical_or_original(&live.executable_path)
            == canonical_or_original(&record.executable_path)
        && live.process_started_at == record.process_started_at
    {
        Ok(live)
    } else {
        Err(InstanceError::IdentityMismatch)
    }
}

fn canonical_or_original(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

#[cfg(unix)]
fn set_private_directory(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700))
}

#[cfg(not(unix))]
fn set_private_directory(_path: &Path) -> std::io::Result<()> {
    Ok(())
}

#[cfg(unix)]
fn set_private_file(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o600))
}

#[cfg(not(unix))]
fn set_private_file(_path: &Path) -> std::io::Result<()> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        InstanceRegistry, ProcessIdentity, ProcessInspector, TrayInstanceRecord,
        validate_live_identity,
    };
    use crate::TRAY_CONTROL_PROTOCOL_VERSION;
    use std::{collections::HashMap, fs, path::PathBuf};
    use uuid::Uuid;

    struct FakeInspector(HashMap<u32, ProcessIdentity>);

    impl ProcessInspector for FakeInspector {
        fn inspect(&self, pid: u32) -> Option<ProcessIdentity> {
            self.0.get(&pid).cloned()
        }
    }

    fn record(path: &str, started: u64) -> TrayInstanceRecord {
        TrayInstanceRecord {
            protocol_version: TRAY_CONTROL_PROTOCOL_VERSION,
            pid: 42,
            nonce: "random-instance-nonce".into(),
            control_endpoint: "/tmp/tray.sock".into(),
            executable_path: PathBuf::from(path),
            process_started_at: started,
        }
    }

    fn temp_registry() -> InstanceRegistry {
        InstanceRegistry::new(
            std::env::temp_dir()
                .join(format!("cthutool-tray-test-{}", Uuid::new_v4()))
                .join("instance.json"),
        )
    }

    #[test]
    fn validates_pid_executable_start_time_and_control_handshake() {
        let expected = record("/opt/cthutool/tray", 100);
        let inspector = FakeInspector(HashMap::from([(
            42,
            ProcessIdentity {
                pid: 42,
                executable_path: PathBuf::from("/opt/cthutool/tray"),
                process_started_at: 100,
            },
        )]));

        assert_eq!(
            validate_live_identity(&expected, &inspector)
                .expect("matching identity")
                .pid,
            42
        );
    }

    #[test]
    fn rejects_reused_pid_with_different_start_time() {
        let expected = record("/opt/cthutool/tray", 100);
        let inspector = FakeInspector(HashMap::from([(
            42,
            ProcessIdentity {
                pid: 42,
                executable_path: PathBuf::from("/opt/cthutool/tray"),
                process_started_at: 101,
            },
        )]));

        assert!(validate_live_identity(&expected, &inspector).is_err());
    }

    #[test]
    fn recovers_only_stale_or_invalid_record() {
        let registry = temp_registry();
        let expected = record("/opt/cthutool/tray", 100);
        registry.write(&expected).expect("write instance");
        let missing = FakeInspector(HashMap::new());

        assert!(
            registry
                .recover_stale(&missing, |_| false)
                .expect("recover stale")
        );
        assert!(!registry.path().exists());
        let _ = fs::remove_dir_all(registry.path().parent().expect("parent"));
    }

    #[test]
    fn preserves_authoritative_instance_after_valid_handshake() {
        let registry = temp_registry();
        let expected = record("/opt/cthutool/tray", 100);
        registry.write(&expected).expect("write instance");
        let inspector = FakeInspector(HashMap::from([(
            42,
            ProcessIdentity {
                pid: 42,
                executable_path: PathBuf::from("/opt/cthutool/tray"),
                process_started_at: 100,
            },
        )]));

        assert!(
            !registry
                .recover_stale(&inspector, |_| true)
                .expect("preserve live")
        );
        assert!(registry.path().exists());
        let _ = fs::remove_dir_all(registry.path().parent().expect("parent"));
    }
}
