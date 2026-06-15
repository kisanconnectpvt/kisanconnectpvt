-- KisanConnect: Seed demo users (password = "password123")
INSERT INTO user_svc.users (id, name, email, phone, password, role) VALUES
  ('a1000000-0000-0000-0000-000000000001','Ravi Kumar','ravi@farm.com','9876543210',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','FARMER'),
  ('a1000000-0000-0000-0000-000000000002','Priya Singh','priya@buyer.com','9876543211',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','BUYER')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_svc.farmer_profiles (user_id, farm_name, location, area_acres) VALUES
  ('a1000000-0000-0000-0000-000000000001','Ravi Green Farms','Telangana, India',12.50)
ON CONFLICT DO NOTHING;
