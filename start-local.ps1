# Starts a local Mintmark test environment:
#   Postgres (Docker) + API (:3001) + website (:3000) + print worker
#
# Double-click start-local.cmd, or run:  .\start-local.ps1
# Press Enter in this window when you are done — that stops everything.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$Host.UI.RawUI.WindowTitle = "Mintmark test lab"

function Write-Step($text) {
  Write-Host ""
  Write-Host $text -ForegroundColor Cyan
}

function Write-Ok($text) { Write-Host "  $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  $text" -ForegroundColor Yellow }
function Fail($text) {
  Write-Host ""
  Write-Host $text -ForegroundColor Red
  Write-Host ""
  Write-Host "Press Enter to close this window."
  [void](Read-Host)
  exit 1
}

function Get-DotEnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path -LiteralPath $Path)) { return "" }
  foreach ($raw in Get-Content -LiteralPath $Path) {
    $line = $raw.Trim()
    if (-not $line -or $line.StartsWith("#")) { continue }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { continue }
    if ($line.Substring(0, $eq).Trim() -ne $Key) { continue }
    $value = $line.Substring($eq + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    return $value
  }
  return ""
}

function Test-PortOpen([int]$Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(400)
    if ($ok -and $client.Connected) { $client.Close(); return $true }
    $client.Close()
    return $false
  } catch {
    return $false
  }
}

function Wait-Http([string]$Url, [int]$Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) { return $true }
    } catch {}
    Start-Sleep -Seconds 1
  }
  return $false
}

function Stop-Tree([int]$ProcessId) {
  if ($ProcessId -le 0) { return }
  cmd.exe /c "taskkill /PID $ProcessId /T /F >nul 2>&1"
}

$started = @()

try {
  Write-Host ""
  Write-Host "  MINTMARK  local test lab" -ForegroundColor White
  Write-Host "  This starts the website and the API on your computer." -ForegroundColor DarkGray

  Write-Step "1/6  Checking Node.js"
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    Fail "Node.js is not installed.`nDownload the LTS installer from https://nodejs.org , install it, then run this again."
  }
  $nodeVersion = (& node -v).TrimStart("v")
  $major = [int]($nodeVersion.Split(".")[0])
  if ($major -lt 20) {
    Fail "Node.js $nodeVersion is too old. Install version 20 or newer from https://nodejs.org"
  }
  Write-Ok "Node.js $nodeVersion"

  Write-Step "2/6  Checking secret keys"
  $envFile = Join-Path $Root "backend\.env"
  if (-not (Test-Path -LiteralPath $envFile)) {
    Copy-Item (Join-Path $Root "backend\.env.example") $envFile
    Fail "Created backend\.env for you.`nFill DATABASE_URL if needed, then run this again. Stripe and Lulu keys can wait until checkout testing."
  }
  if (-not (Get-DotEnvValue $envFile "DATABASE_URL")) {
    Fail "backend\.env is missing DATABASE_URL."
  }
  $optional = @(
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "LULU_CLIENT_KEY",
    "LULU_CLIENT_SECRET",
    "LULU_CONTACT_EMAIL"
  )
  $missingOptional = @()
  foreach ($key in $optional) {
    if (-not (Get-DotEnvValue $envFile $key)) { $missingOptional += $key }
  }
  if ($missingOptional.Count) {
    Write-Host ("Stripe/Lulu keys not set yet ({0}). Site and admin can still run; checkout and print jobs stay off." -f ($missingOptional -join ", "))
  } else {
    Write-Ok "backend\.env looks complete"
  }

  $frontendEnv = Join-Path $Root "frontend\.env.local"
  if (-not (Test-Path -LiteralPath $frontendEnv)) {
    Set-Content -LiteralPath $frontendEnv -Value "NEXT_PUBLIC_API_URL=http://localhost:3001`n" -Encoding utf8
    Write-Ok "Wrote frontend\.env.local so the website talks to the local API"
  }

  Write-Step "3/6  Starting the database"
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  $dbReady = $false
  if ($docker) {
    cmd.exe /c "docker info >nul 2>&1"
    if ($LASTEXITCODE -eq 0) {
      docker compose -f (Join-Path $Root "docker-compose.yml") up -d postgres | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Fail "Docker could not start Postgres. If port 5432 is already in use, close the other database or change the port in docker-compose.yml."
      }
      for ($i = 0; $i -lt 30; $i++) {
        docker exec mintmark-postgres pg_isready -U postgres -d mintmark 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $dbReady = $true; break }
        Start-Sleep -Seconds 1
      }
      if (-not $dbReady) { Fail "Postgres started but never became ready. Open Docker Desktop and try again." }
      Write-Ok "Postgres is running in Docker (mintmark-postgres)"
    } else {
      Write-Warn "Docker Desktop is installed but not running."
    }
  } else {
    Write-Warn "Docker is not installed."
  }
  if (-not $dbReady) {
    if (Test-PortOpen 5432) {
      Write-Ok "Using whatever Postgres is already listening on port 5432"
    } else {
      Fail "No database found.`nInstall Docker Desktop, start it, wait until it says Running, then run this again."
    }
  }

  Write-Step "4/6  Installing packages (first run can take a few minutes)"
  foreach ($app in @("backend", "frontend")) {
    $dir = Join-Path $Root $app
    if (-not (Test-Path (Join-Path $dir "node_modules"))) {
      Write-Host "  Installing $app ..."
      Push-Location $dir
      npm install
      if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install failed in $app" }
      Pop-Location
    } else {
      Write-Ok "$app packages already installed"
    }
  }

  Write-Step "5/6  Preparing the database"
  Push-Location (Join-Path $Root "backend")
  npm run db:migrate
  if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Database migrate failed. Check DATABASE_URL in backend\.env." }
  npm run db:seed
  if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Database seed failed." }
  Pop-Location
  Write-Ok "Catalog is ready"

  Write-Step "6/6  Starting the API and website"
  $backendDir = Join-Path $Root "backend"
  $frontendDir = Join-Path $Root "frontend"

  $api = Start-Process -FilePath "powershell.exe" -PassThru -WorkingDirectory $backendDir -ArgumentList @(
    "-NoExit", "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'Mintmark API'; npm run dev"
  )
  $started += $api.Id

  $worker = Start-Process -FilePath "powershell.exe" -WindowStyle Minimized -PassThru -WorkingDirectory $backendDir -ArgumentList @(
    "-NoExit", "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'Mintmark print worker'; npm run dev:worker"
  )
  $started += $worker.Id

  $web = Start-Process -FilePath "powershell.exe" -PassThru -WorkingDirectory $frontendDir -ArgumentList @(
    "-NoExit", "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'Mintmark website'; npm run dev"
  )
  $started += $web.Id

  Write-Host "  Waiting for the API..."
  if (-not (Wait-Http "http://localhost:3001/health" 45)) {
    Fail "The API did not start on http://localhost:3001.`nLook at the 'Mintmark API' window for the error."
  }
  Write-Ok "API is up on http://localhost:3001"

  Write-Host "  Waiting for the website..."
  if (-not (Wait-Http "http://localhost:3000" 60)) {
    Fail "The website did not start on http://localhost:3000.`nLook at the 'Mintmark website' window for the error."
  }
  Write-Ok "Website is up on http://localhost:3000"

  Start-Process "http://localhost:3000"

  Write-Host ""
  Write-Host "  Ready. Your browser should open the test site." -ForegroundColor Green
  Write-Host "  Website   http://localhost:3000"
  Write-Host "  API       http://localhost:3001/health"
  Write-Host ""
  Write-Host "  Two extra windows show live logs (API and website)."
  Write-Host "  The print worker is running in a minimized window."
  Write-Host ""
  Write-Host "Press Enter here to stop everything and close those windows."
  [void](Read-Host)
}
finally {
  Write-Host ""
  Write-Host "Stopping local Mintmark..."
  foreach ($id in $started) { Stop-Tree $id }
  Get-NetTCPConnection -LocalPort 3000, 3001 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Tree $_.OwningProcess }
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker compose -f (Join-Path $Root "docker-compose.yml") stop postgres 2>$null | Out-Null
  }
  Write-Host "Stopped. You can close this window."
}
