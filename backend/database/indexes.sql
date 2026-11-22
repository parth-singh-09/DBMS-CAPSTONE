-- =====================================================================
-- E-Commerce Order and Customer Analytics System
-- Secondary Indexes (from Project Report Section 6.3)
-- Safe and idempotent creation
-- =====================================================================

USE shop;

-- Helper procedure to create index if not already present
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

DELIMITER $$
CREATE PROCEDURE create_index_if_not_exists(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = p_table_name
          AND index_name = p_index_name
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, ' (', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 1. Index on orders (customer_id, order_date) to optimize customer order history & join filters
CALL create_index_if_not_exists('orders', 'idx_orders_customer', 'customer_id, order_date');

-- 2. Index on order_items (product_id) to optimize product sales joins & aggregates
CALL create_index_if_not_exists('order_items', 'idx_items_product', 'product_id');

-- 3. Index on payments (order_id, status) to optimize payment reconciliation & verification
CALL create_index_if_not_exists('payments', 'idx_payments_order', 'order_id, status');

-- 4. Index on products (category_id) to optimize category browsing and partition queries
CALL create_index_if_not_exists('products', 'idx_products_cat', 'category_id');

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS create_index_if_not_exists;
