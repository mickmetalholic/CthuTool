#Requires -Version 5.1

& {
  Set-StrictMode -Version Latest
  $ErrorActionPreference = "Stop"

  if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
  }

  function Get-FirstNonEmptyValue {
    param(
      [Parameter(Mandatory = $true)]
      [AllowEmptyString()]
      [string[]] $Values,

      [Parameter(Mandatory = $true)]
      [string] $Fallback
    )

    foreach ($value in $Values) {
      if (-not [string]::IsNullOrWhiteSpace($value)) {
        return $value
      }
    }

    return $Fallback
  }

  function Require-Command {
    param(
      [Parameter(Mandatory = $true)]
      [string] $Name
    )

    if (-not (Get-Command -Name $Name -ErrorAction SilentlyContinue)) {
      throw "Missing required command: $Name"
    }
  }

  function Invoke-NativeChecked {
    param(
      [Parameter(Mandatory = $true)]
      [string] $Name,

      [Parameter(Mandatory = $true)]
      [AllowEmptyCollection()]
      [string[]] $Arguments
    )

    & $Name @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code ${LASTEXITCODE}: $Name $($Arguments -join ' ')"
    }
  }

  function Get-NativeOutput {
    param(
      [Parameter(Mandatory = $true)]
      [string] $Name,

      [Parameter(Mandatory = $true)]
      [AllowEmptyCollection()]
      [string[]] $Arguments
    )

    $output = @(& $Name @Arguments)
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code ${LASTEXITCODE}: $Name $($Arguments -join ' ')"
    }

    return (($output | ForEach-Object { [string] $_ }) -join [Environment]::NewLine).Trim()
  }

  function Test-NativeSuccess {
    param(
      [Parameter(Mandatory = $true)]
      [string] $Name,

      [Parameter(Mandatory = $true)]
      [AllowEmptyCollection()]
      [string[]] $Arguments
    )

    & $Name @Arguments *> $null
    return $LASTEXITCODE -eq 0
  }

  $repoUrl = Get-FirstNonEmptyValue -Values @(
    $env:CHC_REPO_URL,
    $env:CHC_REPO
  ) -Fallback "https://github.com/mickmetalholic/CthuTool.git"
  $targetRef = Get-FirstNonEmptyValue -Values @($env:CHC_REF) -Fallback "main"
  $defaultInstallDir = Join-Path $HOME ".cthutool\source\CthuTool"
  $installDir = Get-FirstNonEmptyValue -Values @($env:CHC_INSTALL_DIR) -Fallback $defaultInstallDir
  $installDir = [IO.Path]::GetFullPath($installDir)
  $installMode = Get-FirstNonEmptyValue -Values @($env:CHC_INSTALL_MODE) -Fallback "auto"
  $completionMode = Get-FirstNonEmptyValue -Values @($env:CHC_INSTALL_COMPLETION) -Fallback "auto"

  foreach ($commandName in @("git", "node", "npm")) {
    Require-Command -Name $commandName
  }

  $nodeVersion = Get-NativeOutput -Name "node" -Arguments @("-p", "process.versions.node")
  $nodeMajor = 0
  if (-not [int]::TryParse(($nodeVersion -split "\.")[0], [ref] $nodeMajor) -or $nodeMajor -ne 24) {
    throw "Node 24 is required; found v$nodeVersion"
  }

  if ($installMode -notin @("auto", "local", "remote")) {
    throw "Invalid CHC_INSTALL_MODE: $installMode`nExpected one of: auto, local, remote"
  }

  if ($completionMode -notin @("auto", "none", "powershell", "zsh")) {
    throw "Invalid CHC_INSTALL_COMPLETION: $completionMode`nExpected one of: auto, none, powershell, zsh"
  }

  $scriptPath = $PSCommandPath
  $hasLocalScript = (
    -not [string]::IsNullOrWhiteSpace($scriptPath) -and
    (Test-Path -LiteralPath $scriptPath -PathType Leaf) -and
    [IO.Path]::GetFileName($scriptPath) -eq "install-chc.ps1"
  )
  $localRoot = $null
  if ($hasLocalScript) {
    $resolvedScriptPath = (Resolve-Path -LiteralPath $scriptPath).Path
    $localRoot = Split-Path -Parent (Split-Path -Parent $resolvedScriptPath)
  }

  $selectedMode = $installMode
  if ($selectedMode -eq "auto") {
    if ($hasLocalScript) {
      $selectedMode = "local"
    } else {
      $selectedMode = "remote"
    }
  }

  if ($selectedMode -eq "local" -and -not $hasLocalScript) {
    throw "Local install mode requires running scripts/install-chc.ps1 from a checkout.`nUse CHC_INSTALL_MODE=remote for raw installer usage."
  }

  Write-Output "CthuTool installer"
  Write-Output "mode: $selectedMode"

  if ($selectedMode -eq "remote") {
    Write-Output "repo: $repoUrl"
    Write-Output "ref:  $targetRef"
    Write-Output "dir:  $installDir"

    $existingCheckout = Test-NativeSuccess -Name "git" -Arguments @(
      "-C",
      $installDir,
      "rev-parse",
      "--git-dir"
    )

    if ($existingCheckout) {
      $workingTreeStatus = Get-NativeOutput -Name "git" -Arguments @(
        "-C",
        $installDir,
        "status",
        "--porcelain",
        "--untracked-files=normal"
      )
      if (-not [string]::IsNullOrWhiteSpace($workingTreeStatus)) {
        throw "Update blocked: the managed checkout has uncommitted or untracked changes.`nPreserve those changes, then retry."
      }

      Write-Output "- fetching repository"
      Invoke-NativeChecked -Name "git" -Arguments @(
        "-C",
        $installDir,
        "fetch",
        "--no-tags",
        $repoUrl,
        $targetRef
      )
    } else {
      Write-Output "- cloning repository"
      $installParent = Split-Path -Parent $installDir
      New-Item -ItemType Directory -Path $installParent -Force | Out-Null
      Invoke-NativeChecked -Name "git" -Arguments @("clone", $repoUrl, $installDir)
      Invoke-NativeChecked -Name "git" -Arguments @(
        "-C",
        $installDir,
        "fetch",
        "--no-tags",
        $repoUrl,
        $targetRef
      )
    }

    $targetCommit = Get-NativeOutput -Name "git" -Arguments @(
      "-C",
      $installDir,
      "rev-parse",
      "--verify",
      "FETCH_HEAD^{commit}"
    )
    $targetHasBundle = Test-NativeSuccess -Name "git" -Arguments @(
      "-C",
      $installDir,
      "cat-file",
      "-e",
      "${targetCommit}:apps/cli/dist/index.js"
    )
    if (-not $targetHasBundle) {
      throw "Missing committed CLI bundle in target ${targetCommit}: apps/cli/dist/index.js"
    }

    $targetIsBranch = Test-NativeSuccess -Name "git" -Arguments @(
      "ls-remote",
      "--exit-code",
      "--heads",
      $repoUrl,
      $targetRef
    )
    if ($targetIsBranch -and $existingCheckout) {
      $canFastForward = Test-NativeSuccess -Name "git" -Arguments @(
        "-C",
        $installDir,
        "merge-base",
        "--is-ancestor",
        "HEAD",
        $targetCommit
      )
      if (-not $canFastForward) {
        throw "Update blocked: the managed checkout cannot fast-forward to $targetRef.`nReconcile the local branch manually, then retry."
      }
    }

    if ($existingCheckout) {
      Invoke-NativeChecked -Name "git" -Arguments @(
        "-C",
        $installDir,
        "remote",
        "set-url",
        "origin",
        $repoUrl
      )
      Invoke-NativeChecked -Name "git" -Arguments @(
        "-C",
        $installDir,
        "fetch",
        "--tags",
        "origin"
      )
    }

    Write-Output "- checking out ref"
    if ($targetIsBranch) {
      Invoke-NativeChecked -Name "git" -Arguments @("-C", $installDir, "checkout", $targetRef)
      Write-Output "- fast-forwarding branch"
      Invoke-NativeChecked -Name "git" -Arguments @(
        "-C",
        $installDir,
        "merge",
        "--ff-only",
        $targetCommit
      )
    } else {
      Invoke-NativeChecked -Name "git" -Arguments @(
        "-C",
        $installDir,
        "checkout",
        "--detach",
        $targetCommit
      )
    }

    $installSource = $installDir
  } else {
    $installSource = $localRoot
    Write-Output "dir:  $installSource"
  }

  $packagePath = Join-Path $installSource "package.json"
  if (-not (Test-Path -LiteralPath $packagePath -PathType Leaf)) {
    throw "Missing root package.json: $packagePath"
  }

  $bundlePath = Join-Path $installSource "apps\cli\dist\index.js"
  if (-not (Test-Path -LiteralPath $bundlePath -PathType Leaf)) {
    throw "Missing committed CLI bundle: $bundlePath`nThe selected ref must include apps/cli/dist/index.js."
  }

  Write-Output "- installing global command"
  Invoke-NativeChecked -Name "npm" -Arguments @(
    "install",
    "-g",
    "--ignore-scripts",
    $installSource
  )

  $installedCommand = Get-Command -Name "chc" -ErrorAction SilentlyContinue
  if (-not $installedCommand) {
    throw "Installed chc, but the command is not available on PATH. Restart PowerShell and try chc --help."
  }

  $installedPath = $installedCommand.Source
  if ([string]::IsNullOrWhiteSpace($installedPath)) {
    $installedPath = $installedCommand.Name
  }
  Write-Output "Installed: $installedPath"

  $selectedCompletion = $completionMode
  if ($selectedCompletion -eq "auto") {
    $selectedCompletion = "powershell"
  }

  if ($selectedCompletion -ne "none") {
    Write-Output "- enabling $selectedCompletion completion"
    & chc completion enable $selectedCompletion
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Installed chc does not support automatic $selectedCompletion completion setup."
    }
  }

  Write-Output "Done. Try: chc --help"
}
