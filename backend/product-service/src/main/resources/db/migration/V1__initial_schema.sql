-- KisanConnect: Product Service Schema V1
CREATE SCHEMA IF NOT EXISTS product_svc;

CREATE TABLE IF NOT EXISTS product_svc.products (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id   UUID           NOT NULL,
    name        VARCHAR(200)   NOT NULL,
    description TEXT,
    category    VARCHAR(100),
    scale       VARCHAR(10)    NOT NULL CHECK (scale IN ('SMALL','MEDIUM','LARGE')),
    price       DECIMAL(12,2)  NOT NULL,
    unit        VARCHAR(30)    NOT NULL,
    stock_qty   DECIMAL(12,2)  NOT NULL DEFAULT 0,
    image_url   VARCHAR(500),
    status      VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_farmer   ON product_svc.products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_scale    ON product_svc.products(scale);
CREATE INDEX IF NOT EXISTS idx_products_status   ON product_svc.products(status);
