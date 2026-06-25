Param(
  [Parameter(Mandatory=$true)][string]$service
)

$envFile = ".env.local"
if (-Not (Test-Path $envFile)) {
  Write-Error ".env.local not found in repo root. Create it with your service endpoints and secrets."
  exit 1
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $parts = $line -split "=",2
  if ($parts.Count -lt 2) { return }
  $name = $parts[0].Trim()
  $value = $parts[1].Trim().Trim('"')
  $env:$name = $value
}

$map = @{
  "user" = "backend/user-service"
  "product" = "backend/product-service"
  "order" = "backend/order-service"
  "notification" = "backend/notification-service"
}

if ($service -eq "frontend") {
  Set-Location "frontend"
  if (-Not (Test-Path "node_modules")) { npm install }
  npm start
  return
}

if ($map.ContainsKey($service)) {
  Set-Location $map[$service]
  if (Test-Path "mvnw") { ./mvnw spring-boot:run } else { mvn spring-boot:run }
  return
}

Write-Host "Usage: .\\scripts\\run-service.ps1 <user|product|order|notification|frontend>"
