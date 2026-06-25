$root = Resolve-Path "$PSScriptRoot\.."
$zipPath = Join-Path $root 'frontend\public\kisanconnect-source.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$includePaths = @(
  Join-Path $root 'backend',
  Join-Path $root 'frontend',
  Join-Path $root 'scripts',
  Join-Path $root 'README.md',
  Join-Path $root 'docker-compose.yml',
  Join-Path $root 'deploy.sh',
  Join-Path $root 'start.sh',
  Join-Path $root 'start-nodocker.sh',
  Join-Path $root '.env.example'
)

$files = Get-ChildItem -Path $includePaths -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\node_modules\\|\\target\\|\\.git\\|\\.vscode\\|\\.idea\\|\\.cache\\|\\.next\\|\\kisanconnect-source\.zip$'
}

Compress-Archive -Path ($files | Select-Object -ExpandProperty FullName) -DestinationPath $zipPath -Force
Write-Host "Created downloadable archive at $zipPath"
