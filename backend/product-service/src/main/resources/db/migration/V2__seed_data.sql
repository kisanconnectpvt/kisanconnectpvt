-- KisanConnect: Seed 5 products across all scale tiers
INSERT INTO product_svc.products (farmer_id, name, description, category, scale, price, unit, stock_qty) VALUES
  ('a1000000-0000-0000-0000-000000000001','Fresh Tomatoes','Organic vine tomatoes','Vegetables','SMALL',45.00,'kg',500),
  ('a1000000-0000-0000-0000-000000000001','Basmati Rice','Premium aged basmati','Grains','MEDIUM',85.00,'kg',2000),
  ('a1000000-0000-0000-0000-000000000001','Cotton Bales','Grade A raw cotton','Cotton','LARGE',6500.00,'quintal',50),
  ('a1000000-0000-0000-0000-000000000001','Green Chillies','Fresh spicy chillies','Vegetables','SMALL',60.00,'kg',200),
  ('a1000000-0000-0000-0000-000000000001','Turmeric Powder','Sun-dried, high curcumin','Spices','MEDIUM',120.00,'kg',800)
ON CONFLICT DO NOTHING;
