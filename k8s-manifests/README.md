Kubernetes manifests for Rancher Desktop

Steps to deploy locally using Rancher Desktop (assumes `kubectl` context points to Rancher Desktop cluster):

1. Build images locally (from repo root):

```powershell
docker build -t kisanconnect/user-service:local -f backend/user-service/Dockerfile backend/user-service
docker build -t kisanconnect/product-service:local -f backend/product-service/Dockerfile backend/product-service
docker build -t kisanconnect/order-service:local -f backend/order-service/Dockerfile backend/order-service
docker build -t kisanconnect/notification-service:local -f backend/notification-service/Dockerfile backend/notification-service
docker build -t kisanconnect/frontend:local -f frontend/Dockerfile frontend
```

2. Make images available to the cluster
- If Rancher Desktop is using `dockerd`, local images will be visible automatically.
- If using `containerd`, either push images to a registry or load into the cluster with `ctr`/`nerdctl`.

3. Create the secret used by Deployments (replace values if you changed `.env.local`):

```bash
kubectl create secret generic kisan-secret \
  --from-literal=DATABASE_USERNAME=kcuser \
  --from-literal=DATABASE_PASSWORD=kcpass \
  --from-literal=JWT_SECRET=kisanconnect-local-secret-key-change-in-prod-at-least-32-chars
```

4. Apply manifests:

```bash
kubectl apply -f k8s-manifests/configmap.yaml
kubectl apply -f k8s-manifests/postgres-deployment.yaml
kubectl apply -f k8s-manifests/redis-deployment.yaml
kubectl apply -f k8s-manifests/apps-deployments.yaml
```

5. Kafka: this repo's docker-compose uses Confluent images. For k8s, install Strimzi (recommended) or run Kafka with a lightweight chart. Example (Strimzi quickstart):

```bash
kubectl create namespace kafka
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
# then create a Kafka cluster CR (see Strimzi docs). After creation, set KAFKA_URL in the configmap to the service inside the kafka namespace.
```

6. Access frontend:
- With the `kc-frontend` NodePort (30080) you can open http://localhost:30080

7. Troubleshooting:
- `kubectl get pods -A`, `kubectl logs deploy/<name>` and `kubectl describe pod <pod>` are the primary debug commands.

If you'd like, I can:
- generate a Strimzi Kafka CR for you, or
- push example manifests to use Bitnami Kafka for local testing, or
- create a script to build images and load them into Rancher Desktop's container runtime.
