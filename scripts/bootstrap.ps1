#Requires -Version 5.1
[CmdletBinding()]
param(
  [string] $Directory = (Join-Path $HOME 'Documents\GitHub\CthuTool'),
  [string] $HostId,
  [switch] $NoInteractive,
  [switch] $ConfigureSshRemote
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$stage = 'prerequisites'
$repo = 'git@github.com:mickmetalholic/CthuTool.git'
$interactive = -not $NoInteractive -and -not [Console]::IsInputRedirected
function Invoke-Checked([string]$Command, [string[]]$Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Command failed ($LASTEXITCODE). Completed stages are preserved." }
}
function Download([string]$Url, [string]$Path) {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $Path
}
try {
  $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') { 'arm64' } elseif ([Environment]::Is64BitOperatingSystem) { 'x64' } else { throw 'Only Windows x64/arm64 is supported.' }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw 'Install Windows App Installer/winget and Git for Windows, then rerun bootstrap.' }
    Invoke-Checked winget @('install','--exact','--id','Git.Git','--accept-source-agreements','--accept-package-agreements','--disable-interactivity')
    $env:PATH = [Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH','User')
  }
  if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    $gitBin = Split-Path (Get-Command git).Source
    $gitSsh = [IO.Path]::GetFullPath((Join-Path $gitBin '..\usr\bin'))
    if (Test-Path (Join-Path $gitSsh 'ssh.exe')) { $env:PATH = "$gitSsh;$env:PATH" }
    else {
      if(-not $interactive){throw 'Noninteractive bootstrap requires OpenSSH Client already installed. Enable it in Windows Settings and rerun as your regular user.'}
      $capability=Start-Process powershell.exe -Verb RunAs -Wait -PassThru -ArgumentList @('-NoProfile','-Command',"`$ErrorActionPreference='Stop'; Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0 | Out-Null")
      if($capability.ExitCode -ne 0){throw 'Windows OpenSSH Client preparation failed. Complete the optional feature installation and rerun.'}
      $env:PATH=(Join-Path $env:WINDIR 'System32\OpenSSH')+';'+$env:PATH
      if(-not (Get-Command ssh -ErrorAction SilentlyContinue)){throw 'OpenSSH is not yet available; restart your terminal after Windows finishes the installation and rerun.'}
    }
  }
  $compatible = $false
  if ((Get-Command node -ErrorAction SilentlyContinue) -and (Get-Command npm -ErrorAction SilentlyContinue)) {
    & node -e 'process.exit(process.versions.node.split(".")[0]==="24"?0:1)'
    if ($LASTEXITCODE -eq 0) { & npm --version; $compatible = $LASTEXITCODE -eq 0 }
  }
  if ($compatible) { $nodePath = (& node -p 'process.execPath').Trim() }
  else {
    $temporary = Join-Path ([IO.Path]::GetTempPath()) ('chc-bootstrap-' + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $temporary | Out-Null
    try {
      $table = Join-Path $temporary 'node.tsv'
      if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'bootstrap-node-runtime.tsv'))) { Copy-Item (Join-Path $PSScriptRoot 'bootstrap-node-runtime.tsv') $table }
      else { Download 'https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/bootstrap-node-runtime.tsv' $table }
      $row = Get-Content $table | Where-Object { $_ -notmatch '^#' -and ($_ -split "`t")[1] -eq "win-$arch" } | Select-Object -First 1
      if (-not $row) { throw "Missing pinned Node archive for win-$arch" }
      $version,$target,$url,$checksum = $row -split "`t"
      if ($version -notmatch '^24\.' -or $url -notmatch '^https://nodejs\.org/dist/v24\.') { throw 'Invalid Node runtime lock.' }
      $runtime = Join-Path $HOME ".cthutool\runtime\node\$version\$target"
      if (Test-Path $runtime) {
        if ((Get-Item $runtime -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing linked runtime.' }
        if (-not (Test-Path (Join-Path $runtime 'node_modules\npm\bin\npm-cli.js'))) { throw 'Existing runtime is incomplete; inspect before retrying.' }
      } else {
        $archive = Join-Path $temporary 'node.zip'
        Download $url $archive
        if ((Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant() -ne $checksum) { throw 'Node checksum mismatch; runtime was not installed.' }
        Expand-Archive -LiteralPath $archive -DestinationPath $temporary
        $extracted = Join-Path $temporary "node-v$version-$target"
        if (-not (Test-Path (Join-Path $extracted 'node_modules\npm\bin\npm-cli.js'))) { throw 'Complete Node/npm archive required.' }
        New-Item -ItemType Directory -Force -Path (Split-Path $runtime) | Out-Null
        Move-Item -LiteralPath $extracted -Destination $runtime
      }
      $nodePath = Join-Path $runtime 'node.exe'
    } finally { Remove-Item -LiteralPath $temporary -Recurse -Force }
  }
  $nodeBin = Split-Path $nodePath
  $env:PATH = "$nodeBin;$env:PATH"
  Invoke-Checked $nodePath @('-e','process.exit(process.versions.node.split(".")[0]==="24"?0:1)')
  if (-not $interactive -and -not $HostId) { throw 'Noninteractive bootstrap requires -HostId <published-id>.' }
  $stage = 'GitHub SSH'
  function Test-Ssh {
    $sshArgs = if ($interactive) { @('-T','git@github.com') } else { @('-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-T','git@github.com') }
    $saved = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $answer = (& ssh @sshArgs 2>&1 | Out-String)
    $code = $LASTEXITCODE
    $ErrorActionPreference = $saved
    return ($code -le 1 -and $answer -match 'successfully authenticated')
  }
  if (-not (Test-Ssh)) {
    if (-not $interactive) { throw 'GitHub SSH is unavailable. Register a key and verify the host key before rerunning. No HTTPS fallback.' }
    $sshDir = Join-Path $HOME '.ssh'
    New-Item -ItemType Directory -Force -Path $sshDir | Out-Null
    $keys = @(Get-ChildItem $sshDir -Filter '*.pub' -File | ForEach-Object { $_.FullName.Substring(0,$_.FullName.Length-4) })
    for ($i=0; $i -lt $keys.Count; $i++) { Write-Host "$($i+1)) $($keys[$i])" }
    Write-Host '0) Generate id_ed25519_cthutool (never overwrites an existing key)'
    $choice = Read-Host 'Key number'
    if ($choice -eq '0') {
      $selected = Join-Path $sshDir 'id_ed25519_cthutool'
      if ((Test-Path $selected) -or (Test-Path "$selected.pub")) { throw 'Key already exists; rerun and select it.' }
      Invoke-Checked ssh-keygen @('-t','ed25519','-f',$selected,'-C','CthuTool bootstrap')
    } elseif ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $keys.Count) { $selected = $keys[[int]$choice-1] }
    else { throw 'Invalid key selection.' }
    # Agent may be the existing Windows service or a Git-for-Windows user agent.
    & ssh-add $selected

    if ($LASTEXITCODE -ne 0) {
      if (Get-Service ssh-agent -ErrorAction SilentlyContinue) {
        $serviceProcess=Start-Process powershell.exe -Verb RunAs -Wait -PassThru -ArgumentList @('-NoProfile','-Command',"Set-Service ssh-agent -StartupType Automatic; Start-Service ssh-agent")
        if($serviceProcess.ExitCode -ne 0){throw 'SSH agent service preparation failed; rerun after enabling it.'}
      } else {
        $agentOutput=(& ssh-agent -s | Out-String)
        if($agentOutput -match 'SSH_AUTH_SOCK=([^;]+)'){$env:SSH_AUTH_SOCK=$matches[1]}
        if($agentOutput -match 'SSH_AGENT_PID=([^;]+)'){$env:SSH_AGENT_PID=$matches[1]}
      }
      Invoke-Checked ssh-add @($selected)
    }
    $sshConfig=Join-Path $sshDir 'config'
    if((Test-Path $sshConfig) -and ((Get-Item $sshConfig -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Linked SSH config: add the selected IdentityFile to it manually, then rerun.'}
    $identityPath=$selected.Replace('\','/')
    if(-not (Test-Path $sshConfig) -or (Get-Content -Raw $sshConfig) -notmatch [regex]::Escape("IdentityFile `"$identityPath`"")){
      Add-Content -LiteralPath $sshConfig -Value "`n# CthuTool selected GitHub identity`nHost github.com`n  IdentityFile `"$identityPath`"`n  AddKeysToAgent yes"
    }

    Write-Host 'Register this public key at https://github.com/settings/ssh/new:'
    Get-Content -LiteralPath "$selected.pub"
    Read-Host 'Press Enter after registration' | Out-Null
    if (-not (Test-Ssh)) { throw 'GitHub SSH authentication failed; key files were preserved.' }
  }
  $oldSshCommand = $env:GIT_SSH_COMMAND
  if (-not $interactive) { $env:GIT_SSH_COMMAND = 'ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' }
  try { Invoke-Checked git @('ls-remote',$repo,'HEAD') } finally { $env:GIT_SSH_COMMAND = $oldSshCommand }
  if (-not $interactive) { $env:GIT_SSH_COMMAND = 'ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' }
  $stage = 'SSH checkout'
  $Directory = [IO.Path]::GetFullPath($Directory)
  if (Test-Path $Directory) {
    $root = (& git -C $Directory rev-parse --show-toplevel).Trim()
    if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($root) -ne $Directory) { throw 'Destination contains unrelated content; use -Directory.' }
    $origin = (& git -C $Directory remote get-url origin).Trim()
    if ($origin -match '^https://github\.com/mickmetalholic/CthuTool(?:\.git)?$') {
      if (-not $ConfigureSshRemote) { throw 'Existing HTTPS origin requires explicit -ConfigureSshRemote.' }
      Invoke-Checked git @('-C',$Directory,'remote','set-url','origin',$repo)
    } elseif ($origin -ne $repo -and $origin -ne 'ssh://git@github.com/mickmetalholic/CthuTool.git') { throw 'Destination belongs to another repository.' }
    Write-Host 'Reusing checkout; no reset, fetch or pull; local changes preserved.'
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path $Directory) | Out-Null
    Invoke-Checked git @('clone',$repo,$Directory)
  }
  $stage = 'CLI installation'
  foreach($protectedPath in @((Join-Path $HOME '.cthutool'),(Join-Path $HOME '.cthutool\npm'),(Join-Path $HOME '.cthutool\bin'))){if((Test-Path $protectedPath) -and ((Get-Item $protectedPath -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw "Refusing linked bootstrap storage: $protectedPath"}}
  if (-not (Test-Path (Join-Path $Directory 'apps\cli\dist\index.js'))) { throw 'Checkout lacks committed CLI bundle.' }
  $env:npm_config_prefix = Join-Path $HOME '.cthutool\npm'
  $env:PATH = "$nodeBin;$env:npm_config_prefix;$env:PATH"
  $env:CHC_INSTALL_MODE = 'local'
  $env:CHC_INSTALL_COMPLETION = 'none'
  & (Join-Path $Directory 'scripts\install-chc.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Local CLI installation failed.' }
  $bin = Join-Path $HOME '.cthutool\bin'
  New-Item -ItemType Directory -Force -Path $bin | Out-Null
  $launcher = Join-Path $bin 'chc.cmd'
  if ((Test-Path $launcher) -and (Get-Content -Raw $launcher) -notmatch 'CthuTool bootstrap launcher') { throw "Unmanaged launcher exists: $launcher" }
  $entry = Join-Path $env:npm_config_prefix 'node_modules\cthutool\apps\cli\bin\chc.mjs'
  $content = "@echo off`r`nrem CthuTool bootstrap launcher`r`nset `"PATH=$nodeBin;$bin;$HOME\.local\bin;%PATH%`"`r`nset `"npm_config_prefix=$env:npm_config_prefix`"`r`n`"$nodePath`" `"$entry`" %*`r`nexit /b %ERRORLEVEL%`r`n"
  [IO.File]::WriteAllText("$launcher.tmp",$content,[Text.Encoding]::Default)
  Move-Item -Force -LiteralPath "$launcher.tmp" -Destination $launcher
  $userPath = [Environment]::GetEnvironmentVariable('PATH','User')
  if (($userPath -split ';') -notcontains $bin) { [Environment]::SetEnvironmentVariable('PATH',"$bin;$userPath",'User') }
  $env:PATH = "$bin;$env:PATH"
  $profilePath = Join-Path $HOME 'Documents\PowerShell\Microsoft.PowerShell_profile.ps1'
  New-Item -ItemType Directory -Force -Path (Split-Path $profilePath) | Out-Null
  if (-not (Test-Path $profilePath) -or (Get-Content -Raw $profilePath) -notmatch '# >>> cthutool bootstrap PATH >>>') {
    Add-Content -LiteralPath $profilePath -Value "`n# >>> cthutool bootstrap PATH >>>`n`$env:PATH = `"`$HOME\.cthutool\bin;`$env:PATH`"`n# <<< cthutool bootstrap PATH <<<"
  }
  Invoke-Checked $launcher @('source','status','--no-interactive')
  $flags = if ($interactive) { @() } else { @('--no-interactive') }
  $stage = 'Notion authentication'
  Invoke-Checked $launcher (@('dotfiles','notion','auth','--source',$Directory) + $flags)
  $stage = 'host binding and file review'
  $initArgs = @('dotfiles','init','--source',$Directory) + $flags
  if ($HostId) { $initArgs += @('--host',$HostId) }
  Invoke-Checked $launcher $initArgs
  Write-Host 'Bootstrap complete. Open a new terminal; review env setup --dry-run, env setup, config add for pending files, config diff/apply and mise install as explicit steps.'
} catch {
  Write-Error "Bootstrap incomplete at $stage. Completed prerequisites and checkout remain. $($_.Exception.Message) Resume with chc dotfiles notion auth, then chc dotfiles init --host <id>; resolve reported files with chc dotfiles config add <paths>."
  exit 1
}
