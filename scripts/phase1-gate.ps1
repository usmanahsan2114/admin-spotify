$ErrorActionPreference = "Stop"

# In newer PowerShell versions, native stderr can become error records.
# We want to fail only on non-zero exit codes, not on warnings.
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
  $global:PSNativeCommandUseErrorActionPreference = $false
}

function Invoke-Npm([string[]]$Args) {
  $out = & npm @Args 2>&1
  $code = $LASTEXITCODE
  $out | ForEach-Object { $_ }
  if ($code -ne 0) {
    throw "npm $($Args -join ' ') failed with exit code $code"
  }
}

function Run-AppGate($path) {
  Write-Host "=== GATE: $path ==="
  Push-Location $path

  Invoke-Npm @("ci")
  Invoke-Npm @("run","lint","--if-present")
  Invoke-Npm @("run","typecheck","--if-present")
  Invoke-Npm @("test","--if-present")
  Invoke-Npm @("run","build","--if-present")

  Pop-Location
}

Run-AppGate "."
Run-AppGate "backend"
Run-AppGate "frontend"
Run-AppGate "storefront"

Write-Host "✅ Phase 1 gate passed."
