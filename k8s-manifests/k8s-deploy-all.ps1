<#
Deploy all K8s resources for KisanConnect to the current kubectl context.
This script builds local images, pushes them if requested,
creates the secret, then applies all manifests under k8s-manifests/.
#>

param(
    [switch]$PushToRegistry,
    [string]$Registry = ""
)

$ErrorActionPreference = 'Stop'
foreach ($required in 'DATABASE_USERNAME','DATABASE_PASSWORD','JWT_SECRET','INTERNAL_API_KEY','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET') {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($required))) {
        throw "Required secret environment variable is missing: $required"
    }
}

Write-Host "Building images..."
docker build -t kisanconnect/user-service:local -f backend/user-service/Dockerfile backend/user-service
docker build -t kisanconnect/product-service:local -f backend/product-service/Dockerfile backend/product-service
docker build -t kisanconnect/order-service:local -f backend/order-service/Dockerfile backend/order-service
docker build -t kisanconnect/notification-service:local -f backend/notification-service/Dockerfile backend/notification-service
docker build -t kisanconnect/frontend:local -f frontend/Dockerfile frontend

if ($PushToRegistry) {
    if (-not $Registry) { throw "Registry must be provided when using -PushToRegistry" }
    Write-Host "Tagging and pushing images to $Registry..."
    docker tag kisanconnect/user-service:local $Registry/kisanconnect/user-service:local
    docker push $Registry/kisanconnect/user-service:local
    docker tag kisanconnect/product-service:local $Registry/kisanconnect/product-service:local
    docker push $Registry/kisanconnect/product-service:local
    docker tag kisanconnect/order-service:local $Registry/kisanconnect/order-service:local
    docker push $Registry/kisanconnect/order-service:local
    docker tag kisanconnect/notification-service:local $Registry/kisanconnect/notification-service:local
    docker push $Registry/kisanconnect/notification-service:local
    docker tag kisanconnect/frontend:local $Registry/kisanconnect/frontend:local
    docker push $Registry/kisanconnect/frontend:local
}

Write-Host "Creating or updating secret (kisan-secret)..."
$secretData = @{}
foreach ($name in 'DATABASE_USERNAME','DATABASE_PASSWORD','JWT_SECRET','INTERNAL_API_KEY','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET') {
    $value = [Environment]::GetEnvironmentVariable($name)
    $secretData[$name] = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($value))
}
$secretManifest = @{
    apiVersion = 'v1'
    kind = 'Secret'
    metadata = @{ name = 'kisan-secret' }
    type = 'Opaque'
    data = $secretData
} | ConvertTo-Json -Depth 5
$secretManifest | kubectl apply -f -
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply kisan-secret.' }

Write-Host "Applying K8s manifests..."
kubectl apply -f k8s-manifests/configmap.yaml
kubectl apply -f k8s-manifests/postgres-deployment.yaml
kubectl apply -f k8s-manifests/redis-deployment.yaml
kubectl apply -f k8s-manifests/kafka-deployment.yaml
kubectl apply -f k8s-manifests/apps-deployments.yaml

Write-Host 'Done. Use kubectl get pods -A to monitor.'
