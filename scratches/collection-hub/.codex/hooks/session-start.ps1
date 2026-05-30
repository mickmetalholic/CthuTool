$ErrorActionPreference = "Stop"

function Test-ListeningPort {
  param([int]$Port)

  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  return $null -ne $connection
}

function Test-HttpEndpoint {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 1 -UseBasicParsing
    return @{
      ok = $true
      status = [int]$response.StatusCode
    }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    return @{
      ok = $false
      status = $statusCode
    }
  }
}

function Format-ServiceLine {
  param(
    [string]$Name,
    [string]$Url,
    [int]$Port,
    [string]$ProbeUrl
  )

  $listening = Test-ListeningPort -Port $Port
  $state = if ($listening) { "listening" } else { "not listening" }
  $httpText = "HTTP unavailable"

  if ($listening) {
    $http = Test-HttpEndpoint -Url $ProbeUrl
    if ($http.status) {
      $httpText = "HTTP $($http.status)"
    }
  }

  return "- ${Name}: $Url ($state on port $Port; $httpText via $ProbeUrl)"
}

$appRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$inputJson = [Console]::In.ReadToEnd()
$sessionCwd = $null

if (-not [string]::IsNullOrWhiteSpace($inputJson)) {
  try {
    $sessionCwd = (ConvertFrom-Json $inputJson).cwd
  } catch {
    $sessionCwd = $null
  }
}

if ([string]::IsNullOrWhiteSpace($sessionCwd)) {
  $sessionCwd = (Get-Location).Path
}

if (-not (Test-Path $appRoot)) {
  @{
    continue = $true
    hookSpecificOutput = @{
      hookEventName = "SessionStart"
      additionalContext = $null
    }
  } | ConvertTo-Json -Depth 5 -Compress
  exit 0
}

$resolvedSessionCwd = $null
try {
  $resolvedSessionCwd = (Resolve-Path $sessionCwd -ErrorAction Stop).Path
} catch {
  $resolvedSessionCwd = $sessionCwd
}

$appRootPath = $appRoot.Path.TrimEnd('\')
$sessionCwdPath = $resolvedSessionCwd.TrimEnd('\')
$isXhsWorkspace = $sessionCwdPath.Equals($appRootPath, [System.StringComparison]::OrdinalIgnoreCase) -or
  $sessionCwdPath.StartsWith("$appRootPath\", [System.StringComparison]::OrdinalIgnoreCase)

if (-not $isXhsWorkspace) {
  @{
    continue = $true
    hookSpecificOutput = @{
      hookEventName = "SessionStart"
      additionalContext = $null
    }
  } | ConvertTo-Json -Depth 5 -Compress
  exit 0
}

$webUrl = "http://localhost:3000"
$serverUrl = "http://localhost:3001"

$context = @"
XHS collection organizer session context:
- Workspace: $appRoot
$(Format-ServiceLine -Name "Next.js web" -Url $webUrl -Port 3000 -ProbeUrl $webUrl)
$(Format-ServiceLine -Name "NestJS API" -Url $serverUrl -Port 3001 -ProbeUrl "$serverUrl/api/health")
- Default dev commands from the app workspace:
  - pnpm dev:web
  - pnpm dev:server
  - pnpm dev:extension
- When a user already has the dev services running, prefer using those localhost URLs for browser checks.
- Do not start extra dev servers unless the needed service is missing or isolated verification requires it.
- If you start a temporary service yourself, stop that service before finishing.
"@

@{
  continue = $true
  hookSpecificOutput = @{
    hookEventName = "SessionStart"
    additionalContext = $context
  }
} | ConvertTo-Json -Depth 5 -Compress
