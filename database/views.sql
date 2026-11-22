-- =====================================================================
-- E-Commerce Order and Customer Analytics System
-- Database Views Definition (from Project Report Section 6.2)
-- =====================================================================

USE shop;

-- View 1: Simple Order Report
-- Shows order ID, date, status, total, customer full name, and not_shipped flag
CREATE OR REPLACE VIEW vw_order_report AS
SELECT 
  o.order_id, 
  o.order_date, 
  o.status, 
  o.total_amount,
  CONCAT(c.first_name, ' ', c.last_name) AS customer, 
  (d.delivery_id IS NULL) AS not_shipped
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
LEFT JOIN deliveries d ON d.order_id = o.order_id;

-- View 2: Customer Type (Repeat, One-Time, or No Order)
-- Aggregates orders placed and total spent for non-cancelled orders
CREATE OR REPLACE VIEW vw_customer_type AS
SELECT 
  c.customer_id, 
  c.first_name, 
  COUNT(o.order_id) AS orders_placed,
  IFNULL(SUM(o.total_amount), 0) AS total_spent,
  CASE 
    WHEN COUNT(o.order_id) >= 2 THEN 'REPEAT'
    WHEN COUNT(o.order_id) = 1 THEN 'ONE-TIME'
    ELSE 'NO ORDER' 
  END AS customer_type
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status <> 'CANCELLED'
GROUP BY c.customer_id, c.first_name;
