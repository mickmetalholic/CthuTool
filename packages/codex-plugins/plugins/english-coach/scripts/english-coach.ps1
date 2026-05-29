$ErrorActionPreference = 'Stop'

function Write-JsonObject {
  param([hashtable]$Object)
  $Object | ConvertTo-Json -Compress -Depth 8
}

try {
  $rawInput = [Console]::In.ReadToEnd()
  $hookInput = $null

  if (-not [string]::IsNullOrWhiteSpace($rawInput)) {
    try {
      $hookInput = $rawInput | ConvertFrom-Json
    } catch {
      $hookInput = $null
    }
  }

  $prompt = ''
  if ($null -ne $hookInput) {
    foreach ($name in @('user_prompt', 'prompt', 'message')) {
      if ($hookInput.PSObject.Properties.Name -contains $name) {
        $value = $hookInput.$name
        if ($null -ne $value) {
          $prompt = [string]$value
          break
        }
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($prompt)) {
    Write-JsonObject @{}
    exit 0
  }

  $englishWordMatches = [regex]::Matches($prompt, '\b[A-Za-z][A-Za-z''-]*\b')
  if ($englishWordMatches.Count -lt 1) {
    Write-JsonObject @{}
    exit 0
  }

  $instruction = @'
English Coach is active for the user's latest message.

Before doing any requested task, first review the user's English prose if the latest message contains English intended as natural language. Check grammar, naturalness, tone, and idiomatic usage. Provide:

English check:
Best version: <best natural version, or "Already natural" if no change is needed>
Notes: <brief key corrections or one optional polish note>

Then continue with the actual request.

Do not correct source code, commands, logs, file paths, config keys, quoted text, or names unless the user explicitly asks. If the latest message is mostly not English prose, skip the English check silently.
'@

  Write-JsonObject @{
    systemMessage = $instruction.Trim()
  }
  exit 0
} catch {
  Write-JsonObject @{
    systemMessage = "English Coach hook failed: $($_.Exception.Message)"
  }
  exit 0
}
