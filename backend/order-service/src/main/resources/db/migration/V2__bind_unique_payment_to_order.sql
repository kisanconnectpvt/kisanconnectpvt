ALTER TABLE order_svc.orders
    ADD COLUMN razorpay_payment_id VARCHAR(80);

CREATE UNIQUE INDEX uq_orders_razorpay_payment_id
    ON order_svc.orders (razorpay_payment_id)
    WHERE razorpay_payment_id IS NOT NULL;