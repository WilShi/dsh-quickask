//! Native desktop actions exposed to the ball and panel.
//!
//! These actions deliberately use the operating system's own facilities. No URL is accepted
//! here, and a screenshot is returned only after the platform has produced a non-empty PNG.

use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
#[cfg(any(target_os = "macos", target_os = "windows"))]
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

/// Activate the official DeepSeek Harness desktop application.
///
/// macOS can launch or activate the registered application. Windows activates an existing
/// process whose executable name is exactly DeepSeek Harness; a missing main window is an
/// error rather than a reason to launch an unrelated program or web page.
pub fn open_main() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let (program, args) = harness_open_invocation();
        let mut command = Command::new(program);
        command.args(args);
        return run_command(command, "could not activate DeepSeek Harness");
    }
    #[cfg(target_os = "windows")]
    {
        let command = powershell(windows_open_script());
        return run_command(
            command,
            "could not activate the DeepSeek Harness main window",
        );
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err("opening DeepSeek Harness is supported only on macOS and Windows".to_owned())
    }
}

/// Capture the whole screen into the current or default workspace.
///
/// @param snapshot - the shell snapshot used to resolve the current conversation and workspace.
/// @param override_dir - an explicit output directory, reserved for tests and diagnostics.
/// @returns the absolute path of a verified, non-empty PNG.
pub fn capture_screenshot(
    snapshot: &Value,
    override_dir: Option<PathBuf>,
) -> Result<PathBuf, String> {
    let root = screenshot_root(snapshot, override_dir)?;
    capture_to(root, platform_capture)
}

/// Resolve a screenshot destination without ever falling back to the sidecar's home directory.
fn screenshot_root(snapshot: &Value, override_dir: Option<PathBuf>) -> Result<PathBuf, String> {
    if let Some(path) = override_dir {
        if path.as_os_str().is_empty() {
            return Err("the screenshot output directory is empty".to_owned());
        }
        return Ok(path);
    }
    let session = snapshot.get("session");
    let current_id = session
        .and_then(|value| value.get("following"))
        .and_then(|value| value.get("sessionId"))
        .and_then(Value::as_str);
    if let Some(path) = session
        .and_then(|value| value.get("conversations"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .find(|item| item.get("sessionId").and_then(Value::as_str) == current_id)
        .and_then(|item| item.get("cwd"))
        .and_then(Value::as_str)
        .filter(|path| !path.trim().is_empty())
    {
        return Ok(PathBuf::from(path));
    }
    let default_id = session
        .and_then(|value| value.get("createWorkspace"))
        .and_then(Value::as_str);
    if let Some(path) = session
        .and_then(|value| value.get("workspaces"))
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .find(|item| item.get("workspaceId").and_then(Value::as_str) == default_id)
        .and_then(|item| item.get("path"))
        .and_then(Value::as_str)
        .filter(|path| !path.trim().is_empty())
    {
        return Ok(PathBuf::from(path));
    }
    Err("no current or default workspace is available for the screenshot".to_owned())
}

/// Run one capture and verify its result before revealing the path to a caller.
fn capture_to(
    root: PathBuf,
    capture: impl FnOnce(&Path) -> Result<(), String>,
) -> Result<PathBuf, String> {
    fs::create_dir_all(&root).map_err(|error| {
        format!(
            "could not create the screenshot directory {}: {error}",
            root.display()
        )
    })?;
    let root = fs::canonicalize(&root).map_err(|error| {
        format!(
            "could not resolve the screenshot directory {}: {error}",
            root.display()
        )
    })?;
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("the system clock is before the Unix epoch: {error}"))?
        .as_nanos();
    let path = root.join(format!(
        "quorfloat-screenshot-{}-{nonce}.png",
        std::process::id()
    ));
    capture(&path)?;
    let metadata = fs::metadata(&path).map_err(|error| {
        format!(
            "the screenshot command did not create {}: {error}",
            path.display()
        )
    })?;
    if !metadata.is_file() || metadata.len() == 0 {
        let _ = fs::remove_file(&path);
        return Err(format!(
            "the screenshot command produced an empty file: {}",
            path.display()
        ));
    }
    Ok(path)
}

/// Capture through the platform's full-screen API, never an interactive selection UI.
#[cfg(target_os = "macos")]
fn platform_capture(path: &Path) -> Result<(), String> {
    let mut command = Command::new("screencapture");
    command.arg("-x").arg(path);
    run_command(command, "macOS screencapture failed")
}

/// Use Windows PowerShell and System.Drawing to copy the complete virtual screen.
#[cfg(target_os = "windows")]
fn platform_capture(path: &Path) -> Result<(), String> {
    let mut command = powershell(windows_screenshot_script());
    command.env("DSH_QUORFLOAT_SCREENSHOT_TARGET", path);
    run_command(command, "Windows screenshot capture failed")
}

/// The platform has no supported full-screen implementation.
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn platform_capture(_path: &Path) -> Result<(), String> {
    Err("screen capture is supported only on macOS and Windows".to_owned())
}

/// The exact macOS application activation invocation, separated for contract testing.
#[cfg(any(target_os = "macos", test))]
fn harness_open_invocation() -> (&'static str, Vec<&'static str>) {
    ("open", vec!["-a", "DeepSeek Harness"])
}

/// Build a non-interactive Windows PowerShell invocation.
#[cfg(target_os = "windows")]
fn powershell(script: &str) -> Command {
    let mut command = Command::new("powershell.exe");
    command.args([
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
    ]);
    command
}

/// Activate only the official Harness process's own main window.
#[cfg(any(target_os = "windows", test))]
fn windows_open_script() -> &'static str {
    r#"$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class QuorfloatNativeWindow {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
}
'@
$process = Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } |
  Select-Object -First 1
if ($null -eq $process) { throw 'DeepSeek Harness main window was not found' }
$handle = $process.MainWindowHandle
$command = if ([QuorfloatNativeWindow]::IsIconic($handle)) { 9 } else { 5 }
[void][QuorfloatNativeWindow]::ShowWindowAsync($handle, $command)
if (-not [QuorfloatNativeWindow]::SetForegroundWindow($handle)) {
  throw 'Windows refused to foreground the DeepSeek Harness main window'
}
"#
}

/// Capture every connected display as one virtual-screen bitmap.
#[cfg(any(target_os = "windows", test))]
fn windows_screenshot_script() -> &'static str {
    r#"$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bounds.Size)
  $target = [System.IO.Path]::GetFullPath($env:DSH_QUORFLOAT_SCREENSHOT_TARGET)
  $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
"#
}

/// Wait for a native helper and preserve its real failure instead of claiming success.
#[cfg(any(target_os = "macos", target_os = "windows"))]
fn run_command(mut command: Command, action: &str) -> Result<(), String> {
    let output = command
        .output()
        .map_err(|error| format!("{action}: {error}"))?;
    if output.status.success() {
        return Ok(());
    }
    let detail = String::from_utf8_lossy(&output.stderr);
    let detail = detail.trim();
    if detail.is_empty() {
        Err(format!("{action}: process exited with {}", output.status))
    } else {
        Err(format!("{action}: {detail}"))
    }
}

#[cfg(test)]
mod tests {
    use super::{
        capture_to, harness_open_invocation, screenshot_root, windows_open_script,
        windows_screenshot_script,
    };
    use serde_json::json;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temporary_directory(name: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path =
            std::env::temp_dir().join(format!("quorfloat-{name}-{}-{nonce}", std::process::id()));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn an_explicit_test_directory_wins_over_workspace_facts() {
        let override_dir = PathBuf::from("/tmp/quorfloat-screenshots");
        let snapshot = json!({
            "session": {
                "following": {"sessionId": "s1"},
                "conversations": [{"sessionId": "s1", "cwd": "/work/current"}],
                "createWorkspace": "w1",
                "workspaces": [{"workspaceId": "w1", "path": "/work/default"}]
            }
        });
        assert_eq!(
            screenshot_root(&snapshot, Some(override_dir.clone())).unwrap(),
            override_dir
        );
    }

    #[test]
    fn the_current_conversation_directory_is_the_first_workspace_choice() {
        let snapshot = json!({
            "session": {
                "following": {"sessionId": "s1"},
                "conversations": [{"sessionId": "s1", "cwd": "/work/current"}],
                "createWorkspace": "w1",
                "workspaces": [{"workspaceId": "w1", "path": "/work/default"}]
            }
        });
        assert_eq!(
            screenshot_root(&snapshot, None).unwrap(),
            PathBuf::from("/work/current")
        );
    }

    #[test]
    fn a_new_conversation_uses_the_default_workspace_path() {
        let snapshot = json!({
            "session": {
                "following": null,
                "conversations": [],
                "createWorkspace": "w1",
                "workspaces": [{"workspaceId": "w1", "path": "/work/default"}]
            }
        });
        assert_eq!(
            screenshot_root(&snapshot, None).unwrap(),
            PathBuf::from("/work/default")
        );
    }

    #[test]
    fn no_workspace_is_an_error_instead_of_writing_to_the_sidecar_home() {
        let snapshot = json!({"session": {"following": null, "conversations": [], "createWorkspace": null, "workspaces": []}});
        assert!(screenshot_root(&snapshot, None).is_err());
    }

    #[test]
    fn a_capture_is_returned_only_after_a_nonempty_file_exists() {
        let root = temporary_directory("capture-ok");
        let path = capture_to(root.clone(), |path| {
            fs::write(path, b"png").map_err(|error| error.to_string())
        })
        .unwrap();
        let canonical_root = fs::canonicalize(&root).unwrap();
        assert_eq!(path.parent(), Some(canonical_root.as_path()));
        assert_eq!(fs::read(&path).unwrap(), b"png");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn a_successful_process_without_a_file_is_not_reported_as_a_capture() {
        let root = temporary_directory("capture-missing");
        assert!(capture_to(root.clone(), |_| Ok(())).is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn the_macos_open_action_targets_the_official_application() {
        assert_eq!(
            harness_open_invocation(),
            ("open", vec!["-a", "DeepSeek Harness"])
        );
    }

    #[test]
    fn windows_open_activates_only_the_official_process_and_never_a_web_page() {
        let script = windows_open_script();
        assert!(script.contains("Get-Process -Name 'DeepSeek Harness'"));
        assert!(script.contains("SetForegroundWindow"));
        assert!(!script.contains("Start-Process"));
        assert!(!script.contains("http://"));
        assert!(!script.contains("https://"));
    }

    #[test]
    fn windows_capture_uses_system_drawing_across_the_virtual_screen() {
        let script = windows_screenshot_script();
        assert!(script.contains("System.Drawing"));
        assert!(script.contains("SystemInformation]::VirtualScreen"));
        assert!(script.contains("CopyFromScreen"));
        assert!(script.contains("ImageFormat]::Png"));
    }
}
