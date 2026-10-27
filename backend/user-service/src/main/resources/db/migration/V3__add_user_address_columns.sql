-- KisanConnect: Add address fields to existing users
ALTER TABLE user_svc.users
    ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(150),
    ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(150),
    ADD COLUMN IF NOT EXISTS city VARCHAR(80),
    ADD COLUMN IF NOT EXISTS state VARCHAR(80),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
