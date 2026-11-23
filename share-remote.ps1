<#
.SYNOPSIS
  DCRUSTverse Remote Demonstration Launcher

.DESCRIPTION
  Enables sharing the DCRUSTverse project with reviewers, professors, or clients
  who are remote (not on the same local network).

.PARAMETER Mode
  - "Mobile"    (Default): Starts Expo tunnel for live interactive testing via Expo Go app on iOS/Android.
  - "Web"       : Exports and serves the app as a web link accessible from any browser with zero app installation.
  - "FullStack" : Exposes the live Node.js/Express backend API and the mobile app via public tunnels.
#>

param(
  [ValidateSet('Mobile', 'Web', 'FullStack')]
  [string]$Mode = 'Mobile'
)

$ErrorActionPreference = 'Stop'
$rootDir = $PSScriptRoot
$mobileDir = Join-Path $rootDir 'mobile'
$backendDir = Join-Path $rootDir 'backend'

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       DCRUSTverse - Remote Demonstration Setup          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Mode selected: $Mode" -ForegroundColor Green
Write-Host ""

if ($Mode -eq 'Mobile') {
  Write-Host "Starting Expo Tunnel for Mobile Testing..." -ForegroundColor Cyan
  Write-Host ""
  Write-Host "INSTRUCTIONS FOR THE REMOTE PERSON:" -ForegroundColor Yellow
  Write-Host "1. Install the free 'Expo Go' app from the Google Play Store (Android) or App Store (iOS)."
  Write-Host "2. On Android: Open Expo Go and tap 'Scan QR code', then point the camera at this terminal."
  Write-Host "3. On iPhone: Open the default iOS Camera app, scan the QR code, and tap 'Open in Expo Go'."
  Write-Host "4. The DCRUSTverse app will load instantly on their phone."
  Write-Host "5. They can tap [🎓 Student], [👨‍🏫 Faculty], or [🛡️ Admin] for 1-tap instant portal access!"
  Write-Host ""
  Write-Host "Launching Metro Bundler with Tunnel..." -ForegroundColor Green
  Write-Host "----------------------------------------------------------"
  Push-Location $mobileDir
  try {
    & npx.cmd expo start --tunnel -g
  } finally {
    Pop-Location
  }
}
elseif ($Mode -eq 'Web') {
  Write-Host "Building web bundle for instant browser demo..." -ForegroundColor Cyan
  Push-Location $mobileDir
  try {
    & npx.cmd expo export --platform web
    Write-Host ""
    Write-Host "Starting web server on port 5000..." -ForegroundColor Green
    $serveProcess = Start-Process -FilePath "npx.cmd" -ArgumentList "serve dist -s -l 5000" -PassThru -NoNewWindow
    Start-Sleep -Seconds 2

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host " Launching public web tunnel via localtunnel..." -ForegroundColor Cyan
    Write-Host " Anyone with this link can open DCRUSTverse in Chrome/Safari!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Yellow
    Write-Host ""
    & npx.cmd localtunnel --port 5000
  } finally {
    if ($serveProcess -and -not $serveProcess.HasExited) {
      Stop-Process -Id $serveProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
  }
}
elseif ($Mode -eq 'FullStack') {
  Write-Host "Starting Full-Stack Remote Tunnel (Backend API + Mobile App)..." -ForegroundColor Cyan
  
  Write-Host "1. Starting backend Express server on port 4000..." -ForegroundColor Green
  $backendJob = Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -Command `"& { Set-Location '$backendDir'; & npm.cmd run dev }`"" -PassThru
  Start-Sleep -Seconds 3

  Write-Host "2. Exposing backend API via localtunnel..." -ForegroundColor Green
  Write-Host "   (In another terminal or background process)"
  Write-Host ""
  Write-Host "3. Starting mobile bundler with Expo tunnel..." -ForegroundColor Green
  Push-Location $mobileDir
  try {
    & npx.cmd expo start --tunnel -g
  } finally {
    if ($backendJob -and -not $backendJob.HasExited) {
      Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    }
    Pop-Location
  }
}
