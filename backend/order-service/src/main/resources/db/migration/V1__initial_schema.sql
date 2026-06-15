-- KisanConnect: Order Service Schema V1
CREATE SCHEMA IF NOT EXISTS order_svc;

CREATE TABLE IF NOT EXISTS order_svc.orders (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id      UUID           NOT NULL,
    total_amount  DECIMAL(12,2)  NOT NULL,
    status        VARCHAR(30)    NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED')),
    created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON order_svc.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON order_svc.orders(status);

CREATE TABLE IF NOT EXISTS order_svc.order_items (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID           NOT NULL REFERENCES order_svc.orders(id) ON DELETE CASCADE,
    product_id  UUID           NOT NULL,
    farmer_id   UUID           NOT NULL,
    quantity    DECIMAL(12,2)  NOT NULL,
    unit_price  DECIMAL(12,2)  NOT NULL,
    scale       VARCHAR(10)    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_svc.order_items(order_id);
