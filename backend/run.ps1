param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'build', 'start', 'typecheck', 'test', 'test:docker', 'db:generate', 'db:migrate', 'db:migrate:prod')]
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
  if ($version -notmatch '^v26\.' -or [version]$version.TrimStart('v') -lt [version]'26.13.1') {
    throw 'Node 26.13.1 or a newer Node 26 patch is required.'
  }
  & npm.cmd run $Task
  exit $LASTEXITCODE
} finally {
  $env:PATH = $originalPath
  Pop-Location
}
