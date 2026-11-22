-- =====================================================================
-- E-Commerce Order and Customer Analytics System
-- Initial Seed Records (from Project Report Section 5.2)
-- Idempotent using ON DUPLICATE KEY UPDATE / INSERT IGNORE
-- =====================================================================

USE shop;

-- 1. SEED CUSTOMERS (5 records)
INSERT INTO customers (customer_id, first_name, last_name, email, phone, address) VALUES
(1, 'Aarav', 'Sharma', 'aarav@mail.com', '9810000001', 'Rohini, Delhi'),
(2, 'Priya', 'Verma', 'priya@mail.com', '9810000002', 'MG Road, Bengaluru'),
(3, 'Rohan', 'Mehta', 'rohan@mail.com', '9810000003', 'Park Street, Kolkata'),
(4, 'Neha', 'Singh', 'neha@mail.com', '9810000004', 'Marine Drive, Mumbai'),
(5, 'Karan', 'Gupta', 'karan@mail.com', '9810000005', 'Civil Lines, Jaipur')
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  phone = VALUES(phone),
  address = VALUES(address);

-- 2. SEED CATEGORIES (2 records)
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Electronics', 'Electronic devices, gadgets and peripherals'),
(2, 'Stationery', 'Office and study supplies, writing pads')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

-- 3. SEED PRODUCTS (7 records)
-- Note: Unit price for Notebook A5 is 160 as per report section 5.2 update
INSERT INTO products (product_id, product_name, sku, unit_price, category_id) VALUES
(1, 'Wireless Headphones', 'EL-001', 1200.00, 1),
(2, 'Mechanical Keyboard', 'EL-002', 800.00, 1),
(3, 'USB-C Cable',          'AC-001', 300.00, 1),
(4, 'Notebook A5',          'ST-001', 160.00, 2),
(5, 'Smartwatch',           'EL-003', 2500.00, 1),
(6, 'Pen Set',              'ST-002', 99.00, 2),
(7, 'Webcam',               'EL-004', 1800.00, 1)
ON DUPLICATE KEY UPDATE
  product_name = VALUES(product_name),
  sku = VALUES(sku),
  unit_price = VALUES(unit_price),
  category_id = VALUES(category_id);

-- 4. SEED INVENTORY (7 records - 1:1 with products)
-- Note: USB-C Cable qty is 196 (200 - 4) as per report section 5.2 update
INSERT INTO inventory (inventory_id, product_id, qty_on_hand, reorder_level) VALUES
(1, 1, 40, 10),
(2, 2, 25, 10),
(3, 3, 196, 50),
(4, 4, 300, 50),
(5, 5, 8, 10),
(6, 6, 500, 100),
(7, 7, 15, 10)
ON DUPLICATE KEY UPDATE
  qty_on_hand = VALUES(qty_on_hand),
  reorder_level = VALUES(reorder_level);

-- 5. SEED DISCOUNTS (2 records)
INSERT INTO discounts (discount_id, code, discount_type, value, valid_to) VALUES
(1, 'SAVE10',   'PERCENT', 10.00, '2026-12-31'),
(2, 'WELCOME5', 'PERCENT',  5.00, '2026-12-31')
ON DUPLICATE KEY UPDATE
  discount_type = VALUES(discount_type),
  value = VALUES(value),
  valid_to = VALUES(valid_to);

-- 6. SEED ORDERS (7 records)
INSERT INTO orders (order_id, customer_id, discount_id, order_date, status, total_amount) VALUES
(1, 1, NULL, '2026-09-02', 'DELIVERED', 1800.00),
(2, 1, 1,    '2026-10-05', 'DELIVERED', 720.00),
(3, 2, NULL, '2026-10-07', 'DELIVERED', 1200.00),
(4, 3, NULL, '2026-10-10', 'DELIVERED', 750.00),
(5, 3, NULL, '2026-11-01', 'SHIPPED',   3700.00),
(6, 4, NULL, '2026-11-03', 'CANCELLED', 198.00),
(7, 1, NULL, '2026-11-08', 'PENDING',   1200.00)
ON DUPLICATE KEY UPDATE
  customer_id = VALUES(customer_id),
  discount_id = VALUES(discount_id),
  order_date = VALUES(order_date),
  status = VALUES(status),
  total_amount = VALUES(total_amount);

-- 7. SEED ORDER_ITEMS (10 records)
-- Preserves unit_price at time of purchase
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 1200.00),
(1, 3, 2, 300.00),
(2, 2, 1, 800.00),
(3, 1, 1, 1200.00),
(4, 4, 3, 150.00),
(4, 3, 1, 300.00),
(5, 1, 1, 1200.00),
(5, 5, 1, 2500.00),
(6, 6, 2, 99.00),
(7, 3, 4, 300.00)
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  unit_price = VALUES(unit_price);

-- 8. SEED PAYMENTS (7 records)
INSERT INTO payments (payment_id, order_id, method, amount, status, paid_on) VALUES
(1, 1, 'UPI',        1800.00, 'SUCCESS',  '2026-09-02'),
(2, 2, 'CARD',        720.00, 'SUCCESS',  '2026-10-05'),
(3, 3, 'UPI',        1200.00, 'FAILED',   '2026-10-07'),
(4, 3, 'CARD',       1200.00, 'SUCCESS',  '2026-10-07'),
(5, 4, 'COD',         750.00, 'SUCCESS',  '2026-10-14'),
(6, 5, 'NETBANKING', 3700.00, 'SUCCESS',  '2026-11-01'),
(7, 6, 'UPI',         198.00, 'REFUNDED', '2026-11-03')
ON DUPLICATE KEY UPDATE
  order_id = VALUES(order_id),
  method = VALUES(method),
  amount = VALUES(amount),
  status = VALUES(status),
  paid_on = VALUES(paid_on);

-- 9. SEED DELIVERIES (5 records - 1:1 with orders)
INSERT INTO deliveries (delivery_id, order_id, courier, tracking_no, shipped_on, delivered_on) VALUES
(1, 1, 'BlueDart',  'BD1001', '2026-09-03', '2026-09-06'),
(2, 2, 'Delhivery', 'DL2002', '2026-10-06', '2026-10-10'),
(3, 3, 'DTDC',      'DT3003', '2026-10-08', '2026-10-11'),
(4, 4, 'BlueDart',  'BD1004', '2026-10-15', '2026-10-18'),
(5, 5, 'Delhivery', 'DL2005', '2026-11-02', NULL)
ON DUPLICATE KEY UPDATE
  order_id = VALUES(order_id),
  courier = VALUES(courier),
  tracking_no = VALUES(tracking_no),
  shipped_on = VALUES(shipped_on),
  delivered_on = VALUES(delivered_on);
