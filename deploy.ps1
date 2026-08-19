# Manual Railway deploy for mintmark.
# GitHub auto-deploys are disconnected; this uploads a folder as the image root.
#
#   .\deploy.ps1                 # backend + worker + frontend
#   .\deploy.ps1 backend
#   .\deploy.ps1 worker
#   .\deploy.ps1 frontend
#   .\deploy.ps1 all -Message "fix checkout"
#   .\deploy.ps1 backend -Detach

param(
  [Parameter(Position = 0)]
  [ValidateSet("backend", "api", "worker", "frontend", "web", "all")]
  [string]$Target = "all",

  [Alias("m")]
  [string]$Message = "",

  [switch]$Detach
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  throw "Railway CLI not found. Install it, then run this from the mintmark repo root."
}

switch ($Target) {
  "api" { $Target = "backend" }
  "web" { $Target = "frontend" }
}

$Catalog = [ordered]@{
  backend  = @{ Service = "backend";  Path = "backend";  Config = "railway.json" }
  worker   = @{ Service = "worker";   Path = "backend";  Config = "railway.worker.json" }
  frontend = @{ Service = "frontend"; Path = "frontend"; Config = "railway.toml" }
}

function Assert-Ready([string]$Name) {
  $item = $Catalog[$Name]
  $dir = Join-Path $Root $item.Path
  if (-not (Test-Path -LiteralPath $dir -PathType Container)) {
    throw "Missing folder $($item.Path) for $Name"
  }
  $configPath = Join-Path $dir $item.Config
  if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
    throw "Missing $($item.Config) in $($item.Path) for $Name"
  }
  $docker = if ($Name -eq "worker") { "Dockerfile.worker" } else { "Dockerfile" }
  if (-not (Test-Path -LiteralPath (Join-Path $dir $docker) -PathType Leaf)) {
    throw "Missing $docker in $($item.Path)"
  }
}

function Invoke-MintmarkUp([string]$Name) {
  Assert-Ready $Name
  $item = $Catalog[$Name]
  $dir = Join-Path $Root $item.Path
  $summary = if ($Message) { $Message } else { "manual $Name" }

  $args = @(
    "up", $dir,
    "--path-as-root",
    "--service", $item.Service,
    "--environment", "production",
    "-m", $summary
  )
  if ($Detach) { $args += "--detach" } else { $args += "--ci" }

  Write-Host ""
  Write-Host "Deploying $Name from $($item.Path)\ (path-as-root) -> service $($item.Service)"
  & railway @args
  if ($LASTEXITCODE -ne 0) {
    throw "railway up failed for $Name (exit $LASTEXITCODE)"
  }
}

$queue = if ($Target -eq "all") { @("backend", "worker", "frontend") } else { @($Target) }
foreach ($name in $queue) {
  Invoke-MintmarkUp $name
}

Write-Host ""
Write-Host "Done: $($queue -join ', ')"
if ($Detach) {
  Write-Host "Builds were queued. Check Railway for SUCCESS before treating them as live."
}
