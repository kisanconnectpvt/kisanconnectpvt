#!/usr/bin/env bash
# KisanConnect — Local Development Script
set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
header()  { echo -e "\n${BOLD}${GREEN}$1${NC}"; }
ROOT="$(cd "$(dirname "$0")" && pwd)"

case "${1:-help}" in
  infra)
    header "Starting infrastructure..."
    cd "$ROOT" && docker compose up postgres zookeeper kafka redis kafka-ui -d
    info "Waiting for Postgres..."
    until docker exec kc-postgres pg_isready -U kcuser -d kisanconnect &>/dev/null; do sleep 2; done
    success "Infrastructure ready!"
    echo "  Postgres  → localhost:5432"
    echo "  Kafka     → localhost:9092"
    echo "  Kafka UI  → http://localhost:8090"
    ;;
  user)       header "User Service :8081...";        cd "$ROOT/backend/user-service"        && ./mvnw spring-boot:run ;;
  product)    header "Product Service :8082...";     cd "$ROOT/backend/product-service"     && ./mvnw spring-boot:run ;;
  order)      header "Order Service :8083...";       cd "$ROOT/backend/order-service"       && ./mvnw spring-boot:run ;;
  notification) header "Notification Service :8084..."; cd "$ROOT/backend/notification-service" && ./mvnw spring-boot:run ;;
  frontend)
    header "React Frontend :3000..."
    cd "$ROOT/frontend"
    [ ! -d node_modules ] && npm install
    npm start
    ;;
  test)
    header "Running all integration tests (H2, no Docker needed)..."
    PASS=0; FAIL=0
    for svc in user-service product-service order-service; do
      info "Testing $svc..."
      cd "$ROOT/backend/$svc"
      if ./mvnw test -Dspring.profiles.active=test -q --no-transfer-progress 2>/dev/null; then
        success "$svc — passed"; PASS=$((PASS+1))
      else
        echo -e "${RED}[FAIL]${NC} $svc"; FAIL=$((FAIL+1))
      fi
      cd "$ROOT"
    done
    echo ""
    [ $FAIL -eq 0 ] && success "All $PASS suites passed!" || echo -e "${RED}$FAIL failed${NC}"
    ;;
  stop)   header "Stopping Docker..."; cd "$ROOT" && docker compose down ;;
  clean)  header "Wiping DB volumes..."; cd "$ROOT" && docker compose down -v ;;
  status)
    header "Service Status"
    for entry in "User Service|http://localhost:8081/actuator/health" "Product Service|http://localhost:8082/actuator/health" "Order Service|http://localhost:8083/actuator/health" "React Frontend|http://localhost:3000"; do
      name="${entry%%|*}"; url="${entry##*|}"
      if curl -s --max-time 2 "$url" &>/dev/null; then success "$name → UP"
      else echo -e "${RED}[DOWN]${NC} $name"; fi
    done
    ;;
  urls)
    header "KisanConnect Local URLs"
    echo "  React App:            http://localhost:3000"
    echo "  User Service Swagger: http://localhost:8081/swagger-ui.html"
    echo "  Product Service:      http://localhost:8082/swagger-ui.html"
    echo "  Order Service:        http://localhost:8083/swagger-ui.html"
    echo "  Kafka UI:             http://localhost:8090"
    echo "  Farmer: ravi@farm.com / password123"
    echo "  Buyer:  priya@buyer.com / password123"
    ;;
  *)
    header "KisanConnect Dev Script"
    echo "  ./start.sh infra        Start Postgres + Kafka + Redis"
    echo "  ./start.sh user         User Service :8081"
    echo "  ./start.sh product      Product Service :8082"
    echo "  ./start.sh order        Order Service :8083"
    echo "  ./start.sh notification Notification Service :8084"
    echo "  ./start.sh frontend     React app :3000"
    echo "  ./start.sh test         Run all 40 tests (no Docker)"
    echo "  ./start.sh stop         Stop Docker containers"
    echo "  ./start.sh clean        Wipe DB and stop"
    echo "  ./start.sh status       Check which services are up"
    echo "  ./start.sh urls         Print all URLs"
    ;;
esac
