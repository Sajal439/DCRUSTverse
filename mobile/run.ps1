param(
  [Parameter(Mandatory = $true)]
  [string]$Task
)

$ErrorActionPreference = 'Stop'
$nodeDirectory = Join-Path $PSScriptRoot '../.tools/node-v26.13.1-win-x64'
$originalPath = $env:PATH
Push-Location $PSScriptRoot
try {
  if (Test-Path (Join-Path $nodeDirectory 'node.exe')) {
    $env:PATH = "$nodeDirectory;$originalPath"
  }
  $version = & node --version
  & npm.cmd run $Task
  exit $LASTEXITCODE
} finally {
  $env:PATH = $originalPath
  Pop-Location
}
