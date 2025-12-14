$ErrorActionPreference = "Stop"

function Run-AppGate($path) {
  Write-Host "=== GATE: $path ==="
  Push-Location $path
  npm ci
  npm run lint --if-present
  npm run typecheck --if-present
  npm test --if-present
  npm run build --if-present
  Pop-Location
}

Run-AppGate "."
Run-AppGate "backend"
Run-AppGate "frontend"
Run-AppGate "storefront"

Write-Host "✅ Phase 1 gate passed."
