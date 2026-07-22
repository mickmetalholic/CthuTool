use std::{
    env,
    hash::{DefaultHasher, Hash, Hasher},
    path::{Path, PathBuf},
    sync::{Arc, RwLock, mpsc},
};

use cthutool_agent_tray::{
    instance::{InstanceRegistry, SystemProcessInspector, validate_live_identity},
    model::TraySnapshot,
    supervisor::AgentLaunchConfig,
    tray_control::{
        TrayCommand, TrayControlClient, TrayControlServer, instance_record_path,
        resolve_tray_control_endpoint,
    },
};
use single_instance::SingleInstance;

#[cfg(any(target_os = "macos", target_os = "windows"))]
use cthutool_agent_tray::native::{
    NativeEvent, NativeTrayApplication, install_native_event_forwarders, spawn_supervisor_worker,
};
#[cfg(any(target_os = "macos", target_os = "windows"))]
use winit::event_loop::EventLoop;

fn main() {
    #[cfg(any(target_os = "macos", target_os = "windows"))]
    if env::args().any(|argument| argument == "--smoke-test") {
        match cthutool_agent_tray::native::smoke_test_native_assets() {
            Ok(()) => {
                println!("native tray smoke test passed");
                return;
            }
            Err(error) => {
                eprintln!("native tray smoke test failed: {error}");
                std::process::exit(1);
            }
        }
    }
    if let Err(error) = run() {
        eprintln!("CthuTool Agent tray failed: {error}");
        std::process::exit(1);
    }
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
fn run() -> Result<(), Box<dyn std::error::Error>> {
    let data_dir = resolve_data_dir()?;
    let registry = InstanceRegistry::new(instance_record_path(&data_dir));
    let singleton = SingleInstance::new(&single_instance_name(&data_dir))?;
    if !singleton.is_single() {
        let record = registry.read()?;
        validate_live_identity(&record, &SystemProcessInspector)?;
        TrayControlClient::new(record).open()?;
        return Ok(());
    }
    let _ = registry.recover_stale(&SystemProcessInspector, |record| {
        TrayControlClient::new(record.clone()).health().is_ok()
    });
    let endpoint = resolve_tray_control_endpoint(&data_dir);
    let record = registry.create_record(endpoint, &SystemProcessInspector)?;
    registry.write(&record)?;

    let snapshot = Arc::new(RwLock::new(TraySnapshot::default()));
    let (command_sender, command_receiver) = mpsc::channel();
    let control_server = TrayControlServer::start(
        record.clone(),
        Arc::clone(&snapshot),
        command_sender.clone(),
    )?;
    let event_loop = EventLoop::<NativeEvent>::with_user_event().build()?;
    let proxy = event_loop.create_proxy();
    install_native_event_forwarders(&proxy);
    let worker = spawn_supervisor_worker(
        resolve_agent_launch_config(&data_dir)?,
        Arc::clone(&snapshot),
        command_receiver,
        proxy.clone(),
    );
    let signal_sender = command_sender.clone();
    ctrlc::set_handler(move || {
        let _ = signal_sender.send(TrayCommand::Shutdown);
    })?;
    let mut application = NativeTrayApplication::new(snapshot, command_sender.clone());
    let result = event_loop.run_app(&mut application);
    let _ = command_sender.send(TrayCommand::Shutdown);
    let _ = worker.join();
    control_server.stop()?;
    let _ = registry.remove_if_owned(&record);
    result?;
    drop(singleton);
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn run() -> Result<(), Box<dyn std::error::Error>> {
    Err("the native tray currently supports macOS and Windows; Linux is deferred".into())
}

fn resolve_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    if let Some(value) = argument_value("--user-data-dir")
        .or_else(|| env::var_os("CTHUTOOL_AGENT_DATA_DIR").map(PathBuf::from))
    {
        return Ok(value);
    }
    #[cfg(target_os = "macos")]
    let root = env::var_os("HOME")
        .map(PathBuf::from)
        .map(|home| home.join("Library/Application Support/CthuTool/agent"));
    #[cfg(target_os = "windows")]
    let root = env::var_os("APPDATA")
        .map(PathBuf::from)
        .map(|app_data| app_data.join("CthuTool").join("agent"));
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let root = env::var_os("XDG_STATE_HOME")
        .map(PathBuf::from)
        .or_else(|| env::var_os("HOME").map(|home| PathBuf::from(home).join(".local/state")))
        .map(|state| state.join("cthutool/agent"));
    root.ok_or_else(|| "cannot resolve CthuTool Agent data directory".into())
}

fn resolve_agent_launch_config(
    data_dir: &Path,
) -> Result<AgentLaunchConfig, Box<dyn std::error::Error>> {
    let current_executable = env::current_exe()?;
    let install_root =
        resolve_bundle_root(&current_executable).ok_or("cannot resolve tray install root")?;
    let node_executable = argument_value("--node")
        .or_else(|| env::var_os("CTHUTOOL_BUNDLED_NODE").map(PathBuf::from))
        .unwrap_or_else(|| {
            if cfg!(windows) {
                install_root.join("runtime/node/node.exe")
            } else {
                install_root.join("runtime/node/bin/node")
            }
        });
    let agent_entry_point = argument_value("--agent-entry")
        .or_else(|| env::var_os("CTHUTOOL_AGENT_ENTRY").map(PathBuf::from))
        .unwrap_or_else(|| install_root.join("agent/dist/index.js"));
    let environment_catalog = argument_value("--environment-catalog")
        .or_else(|| env::var_os("CTHUTOOL_AGENT_ENVIRONMENTS_PATH").map(PathBuf::from))
        .or_else(|| Some(install_root.join("agent/environments.json")))
        .filter(|path| path.exists());
    Ok(AgentLaunchConfig {
        node_executable,
        agent_entry_point,
        user_data_dir: data_dir.to_path_buf(),
        environment_catalog,
    })
}

fn resolve_bundle_root(current_executable: &Path) -> Option<&Path> {
    current_executable
        .ancestors()
        .find(|candidate| candidate.join("layout.json").is_file())
        .or_else(|| current_executable.parent().and_then(Path::parent))
}

fn argument_value(name: &str) -> Option<PathBuf> {
    let arguments: Vec<_> = env::args_os().collect();
    arguments
        .iter()
        .position(|argument| argument == name)
        .and_then(|index| arguments.get(index + 1))
        .map(PathBuf::from)
}

fn single_instance_name(data_dir: &Path) -> String {
    let mut hasher = DefaultHasher::new();
    data_dir.hash(&mut hasher);
    format!("cthutool-agent-tray-{:016x}", hasher.finish())
}

#[cfg(test)]
mod tests {
    use super::{resolve_bundle_root, single_instance_name};
    use std::{fs, path::Path};
    use uuid::Uuid;

    #[test]
    fn single_instance_scope_is_stable_per_user_data_root() {
        assert_eq!(
            single_instance_name(Path::new("/users/a/cthutool")),
            single_instance_name(Path::new("/users/a/cthutool"))
        );
        assert_ne!(
            single_instance_name(Path::new("/users/a/cthutool")),
            single_instance_name(Path::new("/users/b/cthutool"))
        );
    }

    #[test]
    fn resolves_bundle_root_above_macos_application_wrapper() {
        let root = std::env::temp_dir().join(format!("cthutool-tray-root-{}", Uuid::new_v4()));
        let executable = root.join("bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray");
        fs::create_dir_all(executable.parent().expect("executable parent")).expect("create app");
        fs::write(root.join("layout.json"), "{}").expect("write layout");

        assert_eq!(resolve_bundle_root(&executable), Some(root.as_path()));

        fs::remove_dir_all(root).expect("remove fixture");
    }
}
