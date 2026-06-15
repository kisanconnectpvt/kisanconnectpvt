-- KisanConnect: User Service Schema V1
CREATE SCHEMA IF NOT EXISTS user_svc;

CREATE TABLE IF NOT EXISTS user_svc.users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    phone       VARCHAR(20),
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('FARMER','BUYER','ADMIN')),
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON user_svc.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON user_svc.users(role);

CREATE TABLE IF NOT EXISTS user_svc.farmer_profiles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES user_svc.users(id) ON DELETE CASCADE,
    farm_name   VARCHAR(200),
    location    VARCHAR(200),
    area_acres  DECIMAL(10,2),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
