#!/usr/bin/env bash
# KisanConnect — No-Docker script (H2 in-memory database)
set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
header()  { echo -e "\n${BOLD}${GREEN}$1${NC}"; }
ROOT="$(cd "$(dirname "$0")" && pwd)"
PROFILE="nodocker"

case "${1:-help}" in
  user)    header "User Service :8081 (H2)...";    cd "$ROOT/backend/user-service"    && ./mvnw spring-boot:run -Dspring-boot.run.profiles=$PROFILE ;;
  product) header "Product Service :8082 (H2)..."; cd "$ROOT/backend/product-service" && ./mvnw spring-boot:run -Dspring-boot.run.profiles=$PROFILE ;;
  order)   header "Order Service :8083 (H2)...";   cd "$ROOT/backend/order-service"   && ./mvnw spring-boot:run -Dspring-boot.run.profiles=$PROFILE ;;
  frontend)
    header "React Frontend :3000..."
    cd "$ROOT/frontend"
    [ ! -d node_modules ] && npm install
    npm start
    ;;
  test)
    header "Running all tests (H2, no Kafka, no Postgres)..."
    for svc in user-service product-service order-service; do
      info "Testing $svc..."; cd "$ROOT/backend/$svc"
      ./mvnw test -Dspring.profiles.active=test -q --no-transfer-progress 2>/dev/null && success "$svc passed" || echo "FAIL: $svc"
      cd "$ROOT"
    done
    ;;
  seed)
    header "Seeding demo data via REST API..."
    info "Registering farmer..."
    curl -s -X POST http://localhost:8081/api/v1/users/register -H 'Content-Type: application/json' \
      -d '{"name":"Ravi Kumar","email":"ravi@farm.com","phone":"9876543210","password":"password123","role":"FARMER"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Farmer registered:', d.get('email','error'))"
    info "Registering buyer..."
    curl -s -X POST http://localhost:8081/api/v1/users/register -H 'Content-Type: application/json' \
      -d '{"name":"Priya Singh","email":"priya@buyer.com","phone":"9876543211","password":"password123","role":"BUYER"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Buyer registered:', d.get('email','error'))"
    info "Getting farmer token..."
    TOKEN=$(curl -s -X POST http://localhost:8081/api/v1/users/login -H 'Content-Type: application/json' -d '{"email":"ravi@farm.com","password":"password123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
    if [ -z "$TOKEN" ]; then echo "Could not get token — is User Service running?"; exit 1; fi
    success "Token obtained"
    info "Creating products..."
    for p in '{"name":"Fresh Tomatoes","category":"Vegetables","scale":"SMALL","price":45.00,"unit":"kg","stockQty":500}' '{"name":"Basmati Rice","category":"Grains","scale":"MEDIUM","price":85.00,"unit":"kg","stockQty":2000}' '{"name":"Cotton Bales","category":"Cotton","scale":"LARGE","price":6500.00,"unit":"quintal","stockQty":50}' '{"name":"Green Chillies","category":"Vegetables","scale":"SMALL","price":60.00,"unit":"kg","stockQty":200}' '{"name":"Turmeric Powder","category":"Spices","scale":"MEDIUM","price":120.00,"unit":"kg","stockQty":800}'; do
      NAME=$(echo $p | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])" 2>/dev/null)
      CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8082/api/v1/products -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$p")
      [ "$CODE" = "201" ] && success "  Created: $NAME" || echo "  Failed ($CODE): $NAME"
    done
    success "Seed complete! ravi@farm.com / priya@buyer.com / password123"
    ;;
  urls)
    header "KisanConnect No-Docker URLs"
    echo "  React App:      http://localhost:3000"
    echo "  User Swagger:   http://localhost:8081/swagger-ui.html"
    echo "  Product Swagger: http://localhost:8082/swagger-ui.html"
    echo "  Order Swagger:  http://localhost:8083/swagger-ui.html"
    echo "  H2 Consoles:    http://localhost:8081/h2-console"
    echo "                  http://localhost:8082/h2-console"
    echo "                  http://localhost:8083/h2-console"
    ;;
  *)
    header "KisanConnect No-Docker Script"
    echo "  ./start-nodocker.sh user        User Service :8081 (H2)"
    echo "  ./start-nodocker.sh product     Product Service :8082 (H2)"
    echo "  ./start-nodocker.sh order       Order Service :8083 (H2)"
    echo "  ./start-nodocker.sh frontend    React app :3000"
    echo "  ./start-nodocker.sh seed        Seed demo data via REST"
    echo "  ./start-nodocker.sh test        Run all tests"
    echo "  ./start-nodocker.sh urls        Print all URLs"
    ;;
esac
