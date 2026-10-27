# 🌾 KisanConnect

India's farmer-first marketplace — farmers sell directly, buyers get fresh produce.

## Hosting (Zero Cost)

| Component            | Platform    | Cost          |
|----------------------|-------------|---------------|
| 4 Spring Boot services | Fly.io    | Free (always-on) |
| PostgreSQL           | Neon        | Free forever  |
| Kafka                | Upstash     | Free tier     |
| React frontend       | Vercel      | Free forever  |
| kisanconnect.in      | Registered  | ₹700/year     |

## Quick Deploy

```bash
# 1. Set your credentials
export DATABASE_URL=jdbc:postgresql://HOST.neon.tech/kisanconnect?sslmode=require
export DATABASE_USERNAME=your-username
export DATABASE_PASSWORD=your-password
export KAFKA_URL=your-upstash-host:9092
export KAFKA_SASL_JAAS_CONFIG="org.apache.kafka...full string...;"
export JWT_SECRET=your-32-char-secret

# 2. Set additional required secrets
export INTERNAL_API_KEY=your-separate-random-service-secret
export RAZORPAY_KEY_ID=your-razorpay-key-id
export RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# 3. Deploy backend services to Fly.io
chmod +x deploy.sh
./deploy.sh

# 4. Deploy frontend to Vercel
# vercel.com → Import kisanconnect → root: frontend → add env vars
```

## Local Development

```bash
./start.sh infra        # Docker: Postgres + Kafka
./start.sh user         # :8081
./start.sh product      # :8082
./start.sh order        # :8083
./start.sh notification # :8084
./start.sh frontend     # :3000
./start.sh test         # Run all 40 tests
```

## Local Development Without Docker

If Docker is not allowed, run services locally using managed infrastructure (Neon/Postgres, Upstash/Confluent Kafka, Redis Cloud) or your own DB/Kafka instances.

1. Create `.env.local` in the repo root with service endpoints and secrets (an example is already provided).

2. Run a backend service (PowerShell):

```powershell
$env:DATABASE_URL="jdbc:postgresql://your-host:5432/kisanconnect"
$env:DATABASE_USERNAME="your-db-user"
$env:DATABASE_PASSWORD="your-db-pass"
$env:KAFKA_URL="your-kafka-host:9092"
$env:JWT_SECRET="your-32-char-secret"
.\scripts\run-service.ps1 user
```

3. Start the frontend (in another terminal):

```powershell
.\scripts\run-service.ps1 frontend
```

Notes:
- The scripts load environment variables from `.env.local` and run the service with `./mvnw spring-boot:run` (backend) or `npm start` (frontend).
- For DB you can use Neon or any Postgres instance; Flyway migrations will run on startup.
- For Kafka, use a managed Kafka provider (Upstash/Confluent Cloud) and set `KAFKA_URL` and auth envs in `.env.local`.

## Seed Accounts

| Role   | Email             | Password    |
|--------|-------------------|-------------|
| Farmer | ravi@farm.com     | password123 |
| Buyer  | priya@buyer.com   | password123 |

## Payments

Checkout uses Razorpay Checkout for UPI, netbanking, cards, and wallets. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env.local` or the Kubernetes secret, using Razorpay test credentials during development. Configure `JWT_SECRET` with a strong shared secret and `INTERNAL_API_KEY` with a separate random service-to-service secret in every backend runtime. The payment service checks the signature, captured status, buyer, amount, and currency before an order can be created. Live payments require an activated Razorpay account, rotated credentials, and production payment/webhook operations.

## Services

| Service              | Fly.io URL                                |
|----------------------|-------------------------------------------|
| User Service         | https://kc-user-service.fly.dev           |
| Product Service      | https://kc-product-service.fly.dev        |
| Order Service        | https://kc-order-service.fly.dev          |
| Notification Service | https://kc-notification-service.fly.dev   |
| Frontend             | https://kisanconnect.in                   |

## Local Docker & Rancher

- **Run with Docker Compose:** uses `.env.local` at repo root for container env vars.

```bash
docker compose up --build
```

- **Rebuild images (if needed):**

```bash
docker compose build --no-cache
docker compose up -d
```

- **Rancher Desktop / k3s:** convert the Compose file to Kubernetes manifests with `kompose` and apply with `kubectl` (or import via the Rancher Desktop UI):

```bash
# install kompose (if not present)
# https://kompose.io
kompose convert -f docker-compose.yml -o k8s-manifests
kubectl apply -f k8s-manifests
```

- **Notes:**
	- The services expect the DB host `postgres` and Kafka host `kc-kafka` from Docker Compose networking; `.env.local` contains container-aware defaults.
	- Frontend runs on port `3000` (mapped to container `80`), backends on `8081-8084`, Postgres on `5432`, Kafka on `9092`, Redis on `6379`.
	- If using Rancher Desktop, ensure the cluster has access to PersistentVolumes for Postgres or use an external DB.

