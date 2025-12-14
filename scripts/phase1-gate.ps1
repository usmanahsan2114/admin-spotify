$ErrorActionPreference = "Stop"

# Prevent native stderr from being promoted to PowerShell errors (PS7+ feature).
if (Test-Path variable:global:PSNativeCommandUseErrorActionPreference) {
  $global:PSNativeCommandUseErrorActionPreference = $false
}

function Invoke-Npm {
  param(
    [Parameter(Mandatory=$true)]
    [string[]]$NpmArgs
  )

  # Don't let native stderr warnings terminate the script:
  $oldEAP = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $out  = & npm @NpmArgs 2>&1
    $code = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $oldEAP
  }

  # Ensure any ErrorRecord objects become plain strings
  $out | ForEach-Object { $_.ToString() }

  if ($code -ne 0) {
    throw "npm $($NpmArgs -join ' ') failed with exit code $code"
  }
}

function Run-AppGate($path) {
  Write-Host "=== GATE: $path ==="
  Push-Location $path

  Invoke-Npm -NpmArgs @("ci")
  Invoke-Npm -NpmArgs @("run","lint","--if-present")
  Invoke-Npm -NpmArgs @("run","typecheck","--if-present")
  Invoke-Npm -NpmArgs @("test","--if-present")
  Invoke-Npm -NpmArgs @("run","build","--if-present")

  Pop-Location
}

Run-AppGate "."
Run-AppGate "backend"
Run-AppGate "frontend"
Run-AppGate "storefront"

Write-Host "✅ Phase 1 gate passed."
