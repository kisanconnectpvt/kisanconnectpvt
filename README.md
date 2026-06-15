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

# 2. Deploy all 4 services to Fly.io
chmod +x deploy.sh
./deploy.sh

# 3. Deploy frontend to Vercel
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

## Seed Accounts

| Role   | Email             | Password    |
|--------|-------------------|-------------|
| Farmer | ravi@farm.com     | password123 |
| Buyer  | priya@buyer.com   | password123 |

## Services

| Service              | Fly.io URL                                |
|----------------------|-------------------------------------------|
| User Service         | https://kc-user-service.fly.dev           |
| Product Service      | https://kc-product-service.fly.dev        |
| Order Service        | https://kc-order-service.fly.dev          |
| Notification Service | https://kc-notification-service.fly.dev   |
| Frontend             | https://kisanconnect.in                   |
