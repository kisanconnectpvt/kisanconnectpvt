# Production Readiness and Safe Cleanup Plan

**Prepared:** 2026-10-27  
**Scope:** KisanConnect React frontend, Spring Boot services, payment integration, CI, and Rancher/Fly deployment configuration.

## Purpose

This document defines the work and verification gates to clean up the repository and improve production security without losing existing behavior. It is a plan, not authorization to discard current edits. No application source, deployment configuration, or data files were changed as part of preparing it.

## Baseline Observed

- The working tree already contains changes across auth, product, order, notification, payment, frontend pages, environment examples, Kubernetes manifests, and README files. There are also untracked files, including `body.json`, a migration, service configuration, payment tests, and `frontend/nginx.conf`.
- Those files may be user work. Do not label or remove them as unwanted until each change has an owner and intent confirmed. Do not use `git reset`, `git checkout`, broad clean commands, or mass deletion as a cleanup strategy.
- Frontend tests are not currently present in `frontend/src/__tests__`; that directory is empty. The frontend scripts provide `start`, `build`, and `test`.
- The only backend test class found that exercises application behavior is `PaymentServiceTest`. Other discovered Java test sources are Kafka test configuration helpers.
- `.github/workflows/ci.yml` runs tests for user, product, and order services and a frontend build. It has no payment-service or notification-service job. Its deploy loop deploys user, product, order, and notification services, but not payment-service.
- The workflow uses `npm ci`, but the frontend has no `package-lock.json`, `yarn.lock`, or `npm-shrinkwrap.json`. Create and commit a lockfile before relying on `npm ci` in CI.
- Existing backend Maven modules are separate services, not one root Maven reactor. Run Maven with each module's `pom.xml` or from that module directory.
- The payment flow uses Razorpay. The payment-service has no durable payment/order record or webhook reconciliation flow. Checkout currently sends item data from the browser to the order service; the order service must not trust browser-supplied prices for a real charge.

## Non-Negotiable Guardrails

1. Capture the initial `git status --short`, `git diff --stat`, and `git diff --name-status` before implementation. Keep a copy of the diff outside the worktree or use a reviewed branch/commit before large refactors.
2. Review tracked and untracked files individually. Mark each as keep, change, or remove with its reason and owner. Preserve unrecognized files until the user confirms their intent.
3. Before any behavior change, write characterization tests for the existing behavior that must remain. For defects, add a failing regression test first, then make the smallest fix.
4. Work in small, independently testable slices. After each slice run its focused test, then the affected module suite, then the full CI-equivalent suite.
5. Never put credentials, payment data, personal data, or production dumps in test fixtures, CI logs, screenshots, or source control. Use provider test credentials stored in a secret manager.
6. Do not use production credentials or real payment instruments in automated tests. Payment tests must use mocks, a provider sandbox, or an explicitly approved low-value manual test.
7. Treat database changes as migrations. Test both a fresh database and an upgrade from a representative prior schema; never reset or wipe the Rancher/production database to make tests pass.
8. A green build is not sufficient for payment or security changes. Require API, browser, migration, and deployment checks described below.

## Risks to Resolve Before Live Payments

These are release blockers unless explicitly accepted by the business owner and documented.

- **Authoritative pricing:** backend order creation must retrieve current product prices and ownership from product-service (or a trusted order quote) rather than accepting `unitPrice` from the browser. Recalculate totals using integer minor units or exact decimal arithmetic and reject stale/invalid quantities.
- **Payment-to-order binding:** persist a payment attempt with authenticated buyer, server-derived amount, currency, selected order/quote, Razorpay order ID, and lifecycle state. Verification must prove the captured gateway payment matches that exact attempt, amount, and currency before marking it paid.
- **Failure/retry/replay:** make create, verify, webhook, and order placement idempotent. Handle browser close, duplicate callbacks, timeouts, payment captured but order placement failed, refund/reconciliation, and out-of-order webhooks.
- **Webhook reconciliation:** verify Razorpay webhook signatures using the raw request body and a webhook secret; deduplicate event IDs. Do not rely only on a browser callback to establish final payment state.
- **Payment method availability:** only offer methods enabled for the merchant account and supported for the payment/currency. UPI availability is a Razorpay account capability/configuration, not something frontend code can force on.
- **Authentication and authorization:** require an authenticated buyer for payment/order endpoints and ensure users can only read or act on their own payments/orders. Never accept buyer ID, role, amount, or payment status as trusted browser assertions.
- **Secrets and token settings:** remove production-use default JWT/payment secrets; fail startup or disable payment routes when required production secrets are missing. Rotate any credential ever committed or shared in logs. Keep test/live keys separate.
- **CORS and transport:** allow only configured, exact frontend origins per environment; production APIs and checkout must use HTTPS. Do not allow arbitrary origins with credentials.
- **Inventory consistency:** reserve/decrement inventory only at the correct order state and restore it on failed/cancelled payment. Make the stock/payment/order transition atomic or recoverable.

## Execution Phases and Gates

### Phase 0: Protect and classify the worktree

- Record the status and full diff; identify changes predating this effort versus changes made during it.
- Review every modified and untracked path. Do not delete `body.json`, migrations, configuration classes, or UI edits based on filename alone.
- Establish a known-good baseline using the test commands below. Record existing failures separately from newly introduced failures.
- Confirm supported local runtimes, test database, Kafka strategy, and whether CI is the authoritative build environment.

**Gate:** every current change is classified, the baseline is reproducible, and the user-approved cleanup scope is explicit.

### Phase 1: Lock dependencies and make CI honest

- Generate and commit the npm lockfile with the project-approved Node/npm version; verify a clean `npm ci` build.
- Add CI jobs for payment-service and notification-service. Ensure all deployed services have a test/build job.
- Decide whether payment-service is intended to deploy to Fly.io, Rancher, both, or neither; align the deploy workflow with that decision.
- Set explicit frontend build environment values. Remove `CI: false` if it masks warnings that should fail CI; document the choice if retained.
- Add formatting, static analysis, dependency/security scanning, and secret scanning after the baseline is stable.

**Gate:** a clean checkout can run the exact CI install/build/test commands, and every deployable service is covered by a required CI job.

### Phase 2: Characterize existing user-visible behavior

Lock down these workflows before cleanup or refactoring:

- Farmer/buyer registration, validation, login, logout, token persistence, and role-based routing.
- Browse/filter products, add/remove/update cart quantities, checkout totals, and buyer address handling.
- Payment create, cancel, failure, success, duplicate callback, and retry behavior.
- Order ownership, status transitions, stock changes, and notifications.
- Direct browser navigation/reload on React routes such as `/checkout` and `/payment`.

Use sanitized fixtures and stable IDs. Document any behavior intentionally changing before updating snapshots or assertions.

**Gate:** the characterization suite passes on the unrefactored application, or existing failures are triaged and accepted as separate work.

### Phase 3: Add backend unit and integration coverage

#### Unit tests by service

- **User:** request validation, password hashing, duplicate email, login failure, JWT claims/expiry, public versus authenticated routes, and role access.
- **Product:** create/update validation, farmer ownership, price/quantity constraints, stock decrement/increment, and insufficient stock.
- **Order:** total calculation, server-derived pricing, buyer/address authorization, state transitions, and inventory compensation.
- **Payment:** missing configuration, supported currency/amount validation, Razorpay order request mapping, invalid signature, valid signature, captured/un-captured status, wrong payment/order/amount/currency, and duplicate verification.
- **Notification:** event mapping, malformed messages, retry/dead-letter behavior, and idempotent event handling.

Keep unit tests independent of network, wall-clock time, real Kafka, and real provider accounts. Mock boundaries and use injected clocks where expiry is tested.

#### Backend integration tests

- Use Spring Boot test slices/MockMvc for HTTP validation, security filters, status codes, and response contracts.
- Use Testcontainers PostgreSQL for JPA/Flyway behavior; H2 can remain useful for fast tests but is not a substitute for PostgreSQL migration/query coverage.
- Use a Kafka test broker or Testcontainers Kafka for event integration; also test broker-unavailable behavior explicitly.
- Use WireMock or MockWebServer for product/user service calls and Razorpay API calls. Assert request auth, amount/currency/order mapping, timeouts, and safe error handling.
- Test migration from the prior schema as well as a fresh schema. Tests must not connect to developer or production databases.
- Add API contract tests for user, product, order, and payment request/response shapes consumed by the React app.

**Gate:** each service has unit coverage for business rules and integration coverage for its database/security/external boundaries; no test requires live secrets or external network access.

### Phase 4: Add frontend unit, integration, and end-to-end coverage

#### Frontend unit tests

- Use React Testing Library and Jest (already available through `react-scripts test`). Test visible states and user actions, not component internals.
- Cover registration/login validation, role-dependent navigation, cart calculations, empty/loading/error states, and checkout method selection.
- Mock API clients and Razorpay's browser SDK. Assert the checkout options, loading/error handling, cancel behavior, and that success calls the verification API before order creation.
- Ensure secrets never appear in browser bundles. Only the Razorpay public key may be sent to the browser.

#### Frontend integration tests

- Render routes with a test router and mock service APIs. Verify auth state, persisted cart/payment attempt, redirects, and response failures.
- Test create-payment-order → open provider checkout → verify callback → create marketplace order → clear cart. Verify no order is created for failed, cancelled, or unverified payment.
- Test direct route refresh and frontend/API CORS behavior using configured test origins.

#### Browser end-to-end tests

- Use Playwright (or the team's chosen browser runner) against disposable backend dependencies and provider sandbox/mocked checkout.
- Cover buyer registration/login, product selection, checkout, UPI and netbanking availability, cancel, declined payment, successful sandbox payment, and order history.
- Do not automate real banking/UPI credentials. Validate provider-enabled method availability with sandbox configuration and retain a manual merchant-dashboard checklist.
- Capture only sanitized traces/screenshots; do not record tokens, personal addresses, or payment credentials.

**Gate:** the principal buyer and farmer workflows pass in browser automation on desktop and a mobile viewport, including failure and cancellation paths.

### Phase 5: Security and production hardening

- Define per-environment configuration schemas and fail-fast validation for required variables.
- Remove insecure defaults from production profiles; set strong JWT signing keys and token policy, rotate stored credentials, and use Kubernetes/Fly secret stores.
- Enforce least privilege and authorization at every service boundary; add rate limits for authentication and payment endpoints.
- Add API request size limits, validation, safe error responses, security headers, TLS, and exact CORS allowlists.
- Add payment persistence, webhook verification, idempotency keys, reconciliation, refund handling, and audit events before enabling live charges.
- Add database backups/restore drills, migration rollback/forward strategy, health/readiness probes, structured redacted logs, metrics, and alerts.
- Pin container base images and dependencies, scan images/dependencies, run containers as non-root, and use immutable versioned image tags rather than reusing `:local` in shared environments.
- Review data retention, personal data exposure in logs, privacy notice, and payment-provider compliance responsibilities.

**Gate:** security review passes, production secrets are provisioned outside source control, recovery is tested, and payment/order reconciliation has an operational owner.

### Phase 6: Clean up and deploy incrementally

- Only after the above gates, remove dead code/dependencies/config one small slice at a time. For each deletion, show its references and tests proving it is unused.
- Keep unrelated refactors out of bug/security fixes. Preserve API compatibility or version changes deliberately.
- Deploy first to an isolated staging namespace/database, run migrations and smoke tests, then canary/gradually promote.
- Verify rollback for both application images and database migrations. Do not roll back a schema destructively after writes have occurred.
- After each deployment, verify auth, catalog, cart, payment sandbox, order creation, inventory, and notification behavior from the browser and API.

**Gate:** staging passes all tests and operational checks; rollback and payment reconciliation are understood before production promotion.

## Suggested Test Commands

Run from the repository root in PowerShell. Maven 3.6.3 or newer and Java 17 are required. The repository has Unix `mvnw` scripts; on Windows, use installed `mvn` or run the wrapper in WSL/Git Bash.

```powershell
mvn -f backend/user-service/pom.xml test
mvn -f backend/product-service/pom.xml test
mvn -f backend/order-service/pom.xml test
mvn -f backend/notification-service/pom.xml test
mvn -f backend/payment-service/pom.xml test
```

After adding and committing the npm lockfile:

```powershell
Push-Location frontend
npm ci
$env:CI = 'true'
npm test -- --watchAll=false
npm run build
Pop-Location
```

Run browser end-to-end tests and Testcontainers suites in CI or a disposable environment. Do not point automated tests at the currently running Rancher database or payment account.

## Definition of Done

- No unclassified tracked or untracked changes are deleted.
- Requirements and behavior changes are approved; pre-existing behavior is protected by tests.
- Frontend unit/integration/e2e and backend unit/integration/contract tests pass from a clean checkout.
- CI tests every service it deploys and deploys the intended payment service.
- Payment uses server-trusted pricing, authenticated ownership, durable idempotent state, captured-status verification, and signed webhook reconciliation.
- No production secrets/default signing keys are in source, image layers, frontend assets, logs, or test output.
- Staging smoke, migration, backup/restore, monitoring, and rollback checks pass before production deployment.