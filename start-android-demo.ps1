param([string]$Subdomain = 'dcrust-backend-live')
$ErrorActionPreference = 'Stop'
if ($Subdomain -notmatch '^[a-z0-9-]+$') { throw 'Use a lowercase tunnel subdomain containing letters, numbers and hyphens.' }
$nodeDirectory = Join-Path $PSScriptRoot '.tools/node-v26.13.1-win-x64'
$backendDirectory = Join-Path $PSScriptRoot 'backend'
$logDirectory = Join-Path $PSScriptRoot 'tmp/android-demo'
$originalPath = $env:PATH
$server = $null
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
try {
  $env:PATH = "$nodeDirectory;$originalPath"
  $listener = Get-NetTCPConnection -State Listen -LocalPort 4000 -ErrorAction SilentlyContinue
  if (-not $listener) {
    $server = Start-Process -FilePath (Join-Path $nodeDirectory 'node.exe') -ArgumentList '--env-file=.env','src/server.ts' -WorkingDirectory $backendDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'backend.log') -RedirectStandardError (Join-Path $logDirectory 'backend-error.log')
    $ready = $false
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
      if ($server.HasExited) { throw 'Backend stopped. Check tmp/android-demo/backend-error.log.' }
      try { Invoke-RestMethod 'http://127.0.0.1:4000/api/v1/ready' -TimeoutSec 2 | Out-Null; $ready = $true; break } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $ready) { throw 'Backend readiness failed. Check the backend environment and database.' }
  }
  Write-Host "Keep this terminal and computer running during the Android demonstration."
  Write-Host "The APK expects https://$Subdomain.loca.lt/api/v1. Confirm the tunnel prints that exact URL."
  & npx.cmd --yes localtunnel@latest --port 4000 --local-host 127.0.0.1 --subdomain $Subdomain
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id }
  $env:PATH = $originalPath
}
