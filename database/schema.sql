-- =====================================================================
-- E-Commerce Order and Customer Analytics System
-- Database Schema Definition (MySQL 8.0.31+ / 8.4+)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shop;

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(50) NOT NULL,
  last_name   VARCHAR(50) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  phone       VARCHAR(15),
  address     VARCHAR(150)
) ENGINE=InnoDB;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL UNIQUE,
  description   VARCHAR(100)
) ENGINE=InnoDB;

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  product_id   INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  sku          VARCHAR(20) UNIQUE,
  unit_price   DECIMAL(10,2) NOT NULL,
  category_id  INT NOT NULL,
  CONSTRAINT chk_products_unit_price CHECK (unit_price > 0),
  CONSTRAINT fk_products_categories FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB;

-- 4. INVENTORY TABLE (1:1 with products)
CREATE TABLE IF NOT EXISTS inventory (
  inventory_id  INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL UNIQUE,
  qty_on_hand   INT NOT NULL,
  reorder_level INT DEFAULT 10,
  last_updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_inventory_qty CHECK (qty_on_hand >= 0),
  CONSTRAINT fk_inventory_products FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB;

-- 5. DISCOUNTS TABLE
CREATE TABLE IF NOT EXISTS discounts (
  discount_id   INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(20) NOT NULL UNIQUE,
  discount_type VARCHAR(10) NOT NULL DEFAULT 'PERCENT',
  value         DECIMAL(8,2) NOT NULL,
  valid_to      DATE NOT NULL,
  CONSTRAINT chk_discounts_value CHECK (value > 0)
) ENGINE=InnoDB;

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  order_id     INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  discount_id  INT NULL,
  order_date   DATE NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'PENDING',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_orders_status CHECK (status IN ('PENDING','SHIPPED','DELIVERED','CANCELLED')),
  CONSTRAINT fk_orders_customers FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  CONSTRAINT fk_orders_discounts FOREIGN KEY (discount_id) REFERENCES discounts(discount_id)
) ENGINE=InnoDB;

-- 7. ORDER_ITEMS TABLE (M:N between orders and products)
CREATE TABLE IF NOT EXISTS order_items (
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id),
  CONSTRAINT chk_order_items_qty CHECK (quantity > 0),
  CONSTRAINT fk_order_items_orders FOREIGN KEY (order_id) REFERENCES orders(order_id),
  CONSTRAINT fk_order_items_products FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB;

-- 8. PAYMENTS TABLE (1:N with orders)
CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  method     VARCHAR(12) NOT NULL,
  amount     DECIMAL(12,2) NOT NULL,
  status     VARCHAR(10) NOT NULL,
  paid_on    DATE NOT NULL,
  CONSTRAINT chk_payments_method CHECK (method IN ('UPI','CARD','NETBANKING','COD')),
  CONSTRAINT chk_payments_amount CHECK (amount > 0),
  CONSTRAINT chk_payments_status CHECK (status IN ('SUCCESS','FAILED','REFUNDED')),
  CONSTRAINT fk_payments_orders FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

-- 9. DELIVERIES TABLE (1:1 with orders)
CREATE TABLE IF NOT EXISTS deliveries (
  delivery_id  INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL UNIQUE,
  courier      VARCHAR(40) NOT NULL,
  tracking_no  VARCHAR(30) UNIQUE,
  shipped_on   DATE,
  delivered_on DATE,
  CONSTRAINT fk_deliveries_orders FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;
