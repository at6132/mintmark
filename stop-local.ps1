# Stops the local Mintmark test lab started by start-local.ps1
$ErrorActionPreference = "SilentlyContinue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Stop-Tree([int]$ProcessId) {
  if ($ProcessId -le 0) { return }
  cmd.exe /c "taskkill /PID $ProcessId /T /F >nul 2>&1"
}

Write-Host "Stopping local Mintmark..."
Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match "mintmark.*(npm run dev|tsx watch)" } |
  ForEach-Object { Stop-Tree $_.ProcessId }

Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Tree $_.OwningProcess }

if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose -f (Join-Path $Root "docker-compose.yml") stop postgres 2>$null | Out-Null
}

Write-Host "Stopped."
