$ErrorActionPreference = "Stop"

function Invoke-Npm {
  param(
    [Parameter(Mandatory=$true)]
    [string[]]$NpmArgs
  )

  # Merge stderr into stdout so warnings don't become PowerShell error records
  $out = & npm @NpmArgs 2>&1
  $code = $LASTEXITCODE

  $out | ForEach-Object { $_ }

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
