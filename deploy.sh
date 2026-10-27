#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  KisanConnect — Fly.io + Neon + Upstash + Vercel Deployment Script
#  Run this from the kisanconnect project root directory
# ─────────────────────────────────────────────────────────────────────────────
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
header()  { echo -e "\n${BOLD}${GREEN}═══ $1 ═══${NC}"; }
err()     { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Check flyctl is installed ──────────────────────────────────────────────────
check_fly() {
  if ! command -v fly &>/dev/null; then
    warn "flyctl not installed. Installing now..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
  fi
  success "flyctl $(fly version | head -1) ready"
}

# ── Deploy a single service ────────────────────────────────────────────────────
deploy_service() {
  local SVC=$1
  local PORT=$2
  local APP="kc-${SVC}"

  header "Deploying ${SVC} → ${APP}"
  cd "$ROOT/backend/$SVC"

  # Create app if it doesn't exist
  if ! fly apps list 2>/dev/null | grep -q "$APP"; then
    info "Creating app: $APP"
    fly apps create "$APP" --org personal
  fi

  # Set secrets from environment variables
  info "Setting secrets for $APP..."
  fly secrets set \
    DATABASE_URL="$DATABASE_URL" \
    DATABASE_USERNAME="$DATABASE_USERNAME" \
    DATABASE_PASSWORD="$DATABASE_PASSWORD" \
    KAFKA_URL="$KAFKA_URL" \
    KAFKA_SECURITY_PROTOCOL="${KAFKA_SECURITY_PROTOCOL:-SASL_SSL}" \
    KAFKA_SASL_MECHANISM="${KAFKA_SASL_MECHANISM:-SCRAM-SHA-256}" \
    KAFKA_SASL_JAAS_CONFIG="$KAFKA_SASL_JAAS_CONFIG" \
    JWT_SECRET="$JWT_SECRET" \
    INTERNAL_API_KEY="$INTERNAL_API_KEY" \
    USER_SERVICE_URL="https://kc-user-service.fly.dev" \
    PRODUCT_SERVICE_URL="https://kc-product-service.fly.dev" \
    PAYMENT_SERVICE_URL="https://kc-payment-service.fly.dev" \
    APP_CORS_ALLOWED_ORIGINS="https://kisanconnect.in,https://www.kisanconnect.in" \
    PORT="$PORT" \
    --app "$APP"

  # Deploy
  info "Building and deploying $SVC..."
  fly deploy --app "$APP" --config fly.toml --ha=false

  success "$SVC deployed! URL: https://${APP}.fly.dev"
  cd "$ROOT"
}

deploy_notification() {
  local APP="kc-notification-service"
  header "Deploying notification-service → $APP"
  cd "$ROOT/backend/notification-service"

  if ! fly apps list 2>/dev/null | grep -q "$APP"; then
    fly apps create "$APP" --org personal
  fi

  fly secrets set \
    KAFKA_URL="$KAFKA_URL" \
    KAFKA_SECURITY_PROTOCOL="${KAFKA_SECURITY_PROTOCOL:-SASL_SSL}" \
    KAFKA_SASL_MECHANISM="${KAFKA_SASL_MECHANISM:-SCRAM-SHA-256}" \
    KAFKA_SASL_JAAS_CONFIG="$KAFKA_SASL_JAAS_CONFIG" \
    JWT_SECRET="$JWT_SECRET" \
    PORT="8084" \
    --app "$APP"

  fly deploy --app "$APP" --config fly.toml --ha=false
  success "notification-service deployed!"
  cd "$ROOT"
}

deploy_payment() {
  local APP="kc-payment-service"
  header "Deploying payment-service → $APP"
  cd "$ROOT/backend/payment-service"

  if ! fly apps list 2>/dev/null | grep -q "$APP"; then
    fly apps create "$APP" --org personal
  fi

  fly secrets set \
    JWT_SECRET="$JWT_SECRET" \
    INTERNAL_API_KEY="$INTERNAL_API_KEY" \
    RAZORPAY_KEY_ID="$RAZORPAY_KEY_ID" \
    RAZORPAY_KEY_SECRET="$RAZORPAY_KEY_SECRET" \
    APP_CORS_ALLOWED_ORIGINS="https://kisanconnect.in,https://www.kisanconnect.in" \
    PORT="8085" \
    --app "$APP"

  fly deploy --app "$APP" --config fly.toml --ha=false
  success "payment-service deployed!"
  cd "$ROOT"
}

# ── Main ───────────────────────────────────────────────────────────────────────
header "KisanConnect Fly.io Deployment"
echo ""

# Validate required env vars
[[ -z "$DATABASE_URL"         ]] && err "DATABASE_URL is not set. Run: export DATABASE_URL=your-neon-url"
[[ -z "$KAFKA_URL"            ]] && err "KAFKA_URL is not set. Run: export KAFKA_URL=your-upstash-url"
[[ -z "$KAFKA_SASL_JAAS_CONFIG"]] && err "KAFKA_SASL_JAAS_CONFIG is not set."
[[ -z "$JWT_SECRET"           ]] && err "JWT_SECRET is not set. Run: export JWT_SECRET=your-32-char-secret"
[[ -z "$INTERNAL_API_KEY"     ]] && err "INTERNAL_API_KEY is not set. Generate a separate random service secret."
[[ -z "$RAZORPAY_KEY_ID"      ]] && err "RAZORPAY_KEY_ID is not set."
[[ -z "$RAZORPAY_KEY_SECRET"  ]] && err "RAZORPAY_KEY_SECRET is not set."

check_fly

# Login if needed
if ! fly auth whoami &>/dev/null; then
  info "Please login to Fly.io..."
  fly auth login
fi

# Deploy all services
deploy_service "user-service"         "8081"
deploy_service "product-service"      "8082"
deploy_service "order-service"        "8083"
deploy_notification
deploy_payment

header "All services deployed!"
echo ""
echo "  User Service:         https://kc-user-service.fly.dev"
echo "  Product Service:      https://kc-product-service.fly.dev"
echo "  Order Service:        https://kc-order-service.fly.dev"
echo "  Notification Service: https://kc-notification-service.fly.dev"
echo "  Payment Service:      https://kc-payment-service.fly.dev"
echo ""
echo "  Swagger UI:"
echo "    https://kc-user-service.fly.dev/swagger-ui.html"
echo "    https://kc-product-service.fly.dev/swagger-ui.html"
echo "    https://kc-order-service.fly.dev/swagger-ui.html"
echo ""
echo "  Next step: Deploy frontend to Vercel"
echo "  Set these env vars in Vercel dashboard:"
echo "    REACT_APP_USER_SERVICE_URL    = https://kc-user-service.fly.dev"
echo "    REACT_APP_PRODUCT_SERVICE_URL = https://kc-product-service.fly.dev"
echo "    REACT_APP_ORDER_SERVICE_URL   = https://kc-order-service.fly.dev"
echo "    REACT_APP_PAYMENT_SERVICE_URL = https://kc-payment-service.fly.dev"
