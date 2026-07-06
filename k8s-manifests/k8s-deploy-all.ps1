<#
Deploy all K8s resources for KisanConnect to the current kubectl context.
This script builds local images, pushes them if requested,
creates the secret, then applies all manifests under k8s-manifests/.
#>

param(
    [switch]$PushToRegistry,
    [string]$Registry = ""
)

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
$secretArgs = @(
    "--from-literal=DATABASE_USERNAME=kcuser",
    "--from-literal=DATABASE_PASSWORD=kcpass",
    "--from-literal=JWT_SECRET=kisanconnect-local-secret-key-change-in-prod-at-least-32-chars"
)
if ($env:STRIPE_SECRET_KEY) {
    $secretArgs += "--from-literal=STRIPE_SECRET_KEY=$env:STRIPE_SECRET_KEY"
}
if ($env:STRIPE_PUBLISHABLE_KEY) {
    $secretArgs += "--from-literal=STRIPE_PUBLISHABLE_KEY=$env:STRIPE_PUBLISHABLE_KEY"
}

kubectl create secret generic kisan-secret @secretArgs --dry-run=client -o yaml | kubectl apply -f -

Write-Host "Applying K8s manifests..."
kubectl apply -f k8s-manifests/configmap.yaml
kubectl apply -f k8s-manifests/postgres-deployment.yaml
kubectl apply -f k8s-manifests/redis-deployment.yaml
kubectl apply -f k8s-manifests/kafka-deployment.yaml
kubectl apply -f k8s-manifests/apps-deployments.yaml

Write-Host 'Done. Use kubectl get pods -A to monitor.'
