# Lizz - Windows Installer
# Usage: powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/arismarioneves/Lizz/main/install.ps1 | iex"

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$REPO        = "https://github.com/arismarioneves/Lizz.git"
$INSTALL_DIR = "$env:USERPROFILE\.lizz"

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ██  ██  " -ForegroundColor Red
Write-Host "  ██  ██  " -NoNewline -ForegroundColor Red; Write-Host "  Lizz" -ForegroundColor White
Write-Host "  ██  ██  " -ForegroundColor Red
Write-Host "██  ██  ██" -ForegroundColor Red
Write-Host "██████████" -ForegroundColor Red
Write-Host ""
Write-Host "  Personal AI Assistant  —  Installer" -ForegroundColor DarkGray
Write-Host ("  " + ("─" * 50)) -ForegroundColor DarkGray
Write-Host ""

function Refresh-EnvPath {
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user    = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = ($machine, $user | Where-Object { $_ }) -join ";"
}

# ── [1/5] Node.js ─────────────────────────────────────────────────────────────
$nodeOk = $false
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = (node --version).TrimStart('v').Split('.')[0]
    if ([int]$nodeVer -ge 20) {
        Write-Host "  [1/5] Node.js OK  $(node --version)" -ForegroundColor Green
        $nodeOk = $true
    }
}
if (-not $nodeOk) {
    Write-Host "  [1/5] Installing Node.js LTS..." -ForegroundColor Yellow
    winget install --id OpenJS.NodeJS.LTS -e --silent
    Refresh-EnvPath
    Write-Host "  [1/5] Node.js OK  $(node --version)" -ForegroundColor Green
}

# ── [2/5] Git ─────────────────────────────────────────────────────────────────
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "  [2/5] Git OK  $(git --version)" -ForegroundColor Green
} else {
    Write-Host "  [2/5] Installing Git..." -ForegroundColor Yellow
    winget install --id Git.Git -e --silent
    Refresh-EnvPath
    Write-Host "  [2/5] Git OK" -ForegroundColor Green
}

# ── [3/5] Download / Update ───────────────────────────────────────────────────
if (Test-Path "$INSTALL_DIR\.git") {
    Write-Host "  [3/5] Updating Lizz..." -ForegroundColor Yellow
    git -C $INSTALL_DIR pull --quiet
} else {
    Write-Host "  [3/5] Downloading Lizz..." -ForegroundColor Yellow
    git clone --quiet $REPO $INSTALL_DIR
}
Write-Host "  [3/5] Download OK" -ForegroundColor Green

# ── [4/5] Build ───────────────────────────────────────────────────────────────
Write-Host "  [4/5] Building..." -ForegroundColor Yellow
Push-Location $INSTALL_DIR
npm install --silent
npm run build --silent
Pop-Location
Write-Host "  [4/5] Build OK" -ForegroundColor Green

# ── [5/5] Launcher + PATH ─────────────────────────────────────────────────────
Write-Host "  [5/5] Creating launcher..." -ForegroundColor Yellow

$launcher = "$INSTALL_DIR\lizz.bat"
@"
@echo off
set LIZZ_HOME=%~dp0
node "%LIZZ_HOME%dist\cli.js" %*
"@ | Out-File -FilePath $launcher -Encoding ascii

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*\.lizz*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$INSTALL_DIR", "User")
    Write-Host "        Added to user PATH" -ForegroundColor DarkGray
}

# Add to PowerShell profile so every new session picks it up (same as .bashrc on Linux)
$profileLine = "`$env:Path += `";$INSTALL_DIR`""
try {
    $profileDir = Split-Path $PROFILE
    if (-not (Test-Path $profileDir)) { New-Item -ItemType Directory -Force -Path $profileDir | Out-Null }
    if (-not (Test-Path $PROFILE))    { New-Item -ItemType File      -Force -Path $PROFILE    | Out-Null }
    $existing = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
    if (-not $existing -or -not $existing.Contains($INSTALL_DIR)) {
        Add-Content $PROFILE "`n# Lizz`n$profileLine"
        Write-Host "        Added to PowerShell profile" -ForegroundColor DarkGray
    }
} catch {}

# Apply to current session immediately
$env:Path += ";$INSTALL_DIR"

Write-Host "  [5/5] Launcher created" -ForegroundColor Green

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host ("  " + ("─" * 50)) -ForegroundColor DarkGray
Write-Host "  ✓ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Starting setup wizard..." -ForegroundColor White
Write-Host ""

& "$INSTALL_DIR\lizz.bat" setup
