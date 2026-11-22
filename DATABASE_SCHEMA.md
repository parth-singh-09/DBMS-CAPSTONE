# Database Schema & Data Dictionary

This document provides the formal architectural specification for the **`shop`** database, including entity definitions, constraints, normalization proofs, views, indexes, and relationship cardinalities.

---

## 1. Database Characteristics
- **Database Engine**: MySQL 8.0.31+ / MySQL 8.4.9
- **Storage Engine**: `InnoDB` (ACID compliant, row-level locking, foreign key enforcement)
- **Character Set**: `utf8mb4` (Collation: `utf8mb4_unicode_ci`)
- **Default Database Name**: `shop`

---

## 2. Entity-Relationship Model & Cardinalities

```
[customers] 1 ──── N [orders] 1 ──── N [order_items] N ──── 1 [products] 1 ──── 1 [inventory]
                       │                     │
                       ├── 1 ──── N [payments] │
                       │                     └── N ──── 1 [categories]
                       ├── 1 ──── 1 [deliveries]
                       │
                       └── N ──── 1 [discounts]
```

### Relational Cardinalities
1. **Customer → Orders (`1:N`)**: A customer can place zero or many orders. Each order belongs to exactly one customer (`orders.customer_id` NOT NULL).
2. **Orders ↔ Products (`M:N` via `order_items`)**: An order contains one or more products; a product can appear in multiple orders. Resolved through composite table `order_items` with primary key `(order_id, product_id)`.
3. **Category → Products (`1:N`)**: A category holds multiple products. Every product references one category (`products.category_id` NOT NULL).
4. **Product → Inventory (`1:1`)**: Every product has exactly one inventory stock record. Enforced by `inventory.product_id` defined as `INT NOT NULL UNIQUE`.
5. **Discount → Orders (`1:N`)**: A promotional discount code may be applied to multiple orders. An order may have at most one discount code (`orders.discount_id` NULLABLE).
6. **Orders → Payments (`1:N`)**: An order can have multiple payment attempts or installment transactions (e.g. initial failed attempt followed by success).
7. **Orders → Deliveries (`1:1`)**: An order has at most one physical delivery consignment. Enforced by `deliveries.order_id` defined as `INT NOT NULL UNIQUE`.

---

## 3. Normalization Analysis (1NF, 2NF, 3NF, BCNF)

### 1NF (First Normal Form)
- All attribute values are atomic (e.g. customer `address` stores single scalar values; order line items are normalized into individual rows rather than arrays or delimited strings).
- Each table possesses an explicit primary key ensuring unique row identification.

### 2NF (Second Normal Form)
- The database is in 1NF.
- There are no **partial dependencies**. In tables with composite primary keys (`order_items` with PK `(order_id, product_id)`), non-key attributes (`quantity`, `unit_price`) functionally depend on the entire composite key, not a single component.

### 3NF (Third Normal Form) & BCNF (Boyce-Codd Normal Form)
- The database is in 2NF.
- There are no **transitive functional dependencies** ($X \rightarrow Y \rightarrow Z$):
  - Product category information (`category_name`, `description`) is factored out into `categories`, rather than being redundantly repeated in `products`.
  - Stock levels (`qty_on_hand`, `reorder_level`) are factored into `inventory` rather than stored in `products`.
  - Delivery logistics (`courier`, `tracking_no`, timestamps) are factored into `deliveries` rather than embedded in `orders`.
- Every functional dependency $X \rightarrow Y$ in the schema has $X$ as a superkey.

---

## 4. Complete Data Dictionary (9 Tables)

### Table 1: `customers`
Stores registered customer contact and address details.

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `customer_id` | INT | NO | AUTO_INCREMENT | PK | Unique customer identifier |
| `first_name` | VARCHAR(50) | NO | — | — | Customer first name |
| `last_name` | VARCHAR(50) | NO | — | — | Customer last name |
| `email` | VARCHAR(100) | NO | — | UNI | Unique email address |
| `phone` | VARCHAR(15) | YES | NULL | — | Contact telephone number |
| `address` | VARCHAR(255) | YES | NULL | — | Shipping/Billing address |

---

### Table 2: `categories`
Product classifications.

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `category_id` | INT | NO | AUTO_INCREMENT | PK | Unique category identifier |
| `category_name`| VARCHAR(50) | NO | — | UNI | Unique category name |
| `description` | VARCHAR(255) | YES | NULL | — | Category summary |

---

### Table 3: `products`
Product catalog entries and current catalog price.

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `product_id` | INT | NO | AUTO_INCREMENT | PK | Unique product identifier |
| `product_name` | VARCHAR(100) | NO | — | — | Commercial product title |
| `sku` | VARCHAR(50) | YES | NULL | UNI | Unique Stock Keeping Unit |
| `unit_price` | DECIMAL(10,2)| NO | — | — | Catalog price; `CHECK (unit_price > 0)` |
| `category_id` | INT | NO | — | FK | References `categories(category_id)` ON DELETE RESTRICT |

---

### Table 4: `inventory`
Warehouse stock levels (1:1 with products).

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `inventory_id` | INT | NO | AUTO_INCREMENT | PK | Unique inventory record ID |
| `product_id` | INT | NO | — | UNI, FK | References `products(product_id)` (1:1 relationship) |
| `qty_on_hand` | INT | NO | 0 | — | Physical stock; `CHECK (qty_on_hand >= 0)` |
| `reorder_level`| INT | NO | 5 | — | Reorder threshold flag |
| `last_updated` | TIMESTAMP | NO | CURRENT_TIMESTAMP | — | Timestamp of last stock change |

---

### Table 5: `discounts`
Promotional coupons and voucher codes.

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `discount_id` | INT | NO | AUTO_INCREMENT | PK | Unique discount ID |
| `code` | VARCHAR(20) | NO | — | UNI | Unique promotional coupon code |
| `discount_type`| VARCHAR(10) | NO | — | — | `CHECK (discount_type IN ('PERCENT', 'FLAT'))` |
| `value` | DECIMAL(10,2)| NO | — | — | Discount discount amount; `CHECK (value > 0)` |
| `valid_to` | DATE | NO | — | — | Expiration date of the promotional coupon |

---

### Table 6: `orders`
Master order transactions.

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `order_id` | INT | NO | AUTO_INCREMENT | PK | Unique order identifier |
| `customer_id` | INT | NO | — | FK | References `customers(customer_id)` ON DELETE RESTRICT |
| `discount_id` | INT | YES | NULL | FK | References `discounts(discount_id)` ON DELETE SET NULL |
| `order_date` | DATE | NO | — | — | Date of order placement |
| `status` | VARCHAR(15) | NO | 'PENDING' | — | `CHECK (status IN ('PENDING','SHIPPED','DELIVERED','CANCELLED'))` |
| `total_amount` | DECIMAL(10,2)| NO | 0.00 | — | Calculated order total; `CHECK (total_amount >= 0)` |

---

### Table 7: `order_items`
Order line items (Composite Primary Key).

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `order_id` | INT | NO | — | PK, FK | References `orders(order_id)` ON DELETE CASCADE |
| `product_id` | INT | NO | — | PK, FK | References `products(product_id)` ON DELETE RESTRICT |
| `quantity` | INT | NO | — | — | Number of units ordered; `CHECK (quantity > 0)` |
| `unit_price` | DECIMAL(10,2)| NO | — | — | Historical price charged at order time; `CHECK (unit_price > 0)` |

**Composite Primary Key:** `PRIMARY KEY (order_id, product_id)`.

---

### Table 8: `payments`
Financial transaction attempts.

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment_id` | INT | NO | AUTO_INCREMENT | PK | Unique payment record ID |
| `order_id` | INT | NO | — | FK | References `orders(order_id)` ON DELETE RESTRICT |
| `method` | VARCHAR(20) | NO | — | — | `CHECK (method IN ('UPI', 'CARD', 'NETBANKING', 'COD'))` |
| `amount` | DECIMAL(10,2)| NO | — | — | Amount paid; `CHECK (amount > 0)` |
| `status` | VARCHAR(15) | NO | — | — | `CHECK (status IN ('SUCCESS', 'FAILED', 'REFUNDED'))` |
| `paid_on` | DATE | NO | — | — | Date of payment transaction |

---

### Table 9: `deliveries`
Shipping and logistics tracking (1:1 with orders).

| Column | Data Type | Nullable | Default | Key | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `delivery_id` | INT | NO | AUTO_INCREMENT | PK | Unique delivery tracking record |
| `order_id` | INT | NO | — | UNI, FK | References `orders(order_id)` (1:1 relationship) |
| `courier` | VARCHAR(50) | NO | — | — | Logistics carrier (e.g. 'BlueDart', 'Delhivery') |
| `tracking_no` | VARCHAR(100)| YES | NULL | UNI | Unique consignment tracking code |
| `shipped_on` | DATE | YES | NULL | — | Date package was handed to courier |
| `delivered_on` | DATE | YES | NULL | — | Date shipment was received by customer |

---

## 5. Stored Views

### 1. `vw_order_report`
Consolidates orders with customer full names and delivery dispatch flags:
```sql
CREATE VIEW vw_order_report AS
SELECT o.order_id, o.order_date, o.status, o.total_amount,
       CONCAT(c.first_name, ' ', c.last_name) AS customer,
       d.delivery_id IS NULL AS not_shipped
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
LEFT JOIN deliveries d ON d.order_id = o.order_id;
```

### 2. `vw_customer_type`
Classifies customers based on purchase frequency and computes lifetime spend:
```sql
CREATE VIEW vw_customer_type AS
SELECT c.customer_id, c.first_name, COUNT(o.order_id) AS orders_placed,
       IFNULL(SUM(o.total_amount), 0) AS total_spent,
       CASE WHEN COUNT(o.order_id) >= 2 THEN 'REPEAT'
            WHEN COUNT(o.order_id) = 1 THEN 'ONE-TIME'
            ELSE 'NO ORDER' END AS customer_type
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status <> 'CANCELLED'
GROUP BY c.customer_id, c.first_name;
```

---

## 6. Secondary B-Tree Indexes

| Index Name | Table | Indexed Columns | Index Type | Purpose / Query Optimization |
| :--- | :--- | :--- | :--- | :--- |
| `idx_orders_customer` | `orders` | `(customer_id, order_date)` | `BTREE` | Fast lookups for customer order history and JOINs |
| `idx_items_product` | `order_items` | `(product_id)` | `BTREE` | Accelerates product sales aggregation and joins |
| `idx_payments_order` | `payments` | `(order_id, status)` | `BTREE` | Accelerates order payment status reconciliation |
| `idx_products_cat` | `products` | `(category_id)` | `BTREE` | Optimizes category filtering and window partitions |

---

## 7. Sample Records Summary

- **Customers (5)**: Aarav Sharma, Priya Patel, Rohan Mehta, Sneha Rao, Karan Gupta.
- **Categories (2)**: Electronics, Accessories.
- **Products (7)**: Wireless Headphones, USB-C Cable, Mechanical Keyboard, Gaming Mouse, Smartwatch, Laptop Stand, Webcam.
- **Inventory (7)**: Pre-stocked items with low-stock flag on Smartwatch (`qty: 8 <= reorder: 10`).
- **Discounts (2)**: `SAVE10` (10% Percent discount), `FLAT50` (₹50 Flat discount).
- **Orders (7)**: Orders 1 to 7 across various lifecycle states (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- **Order Items (10)**: Normalized lines preserving purchase price.
- **Payments (7)**: UPI, CARD, NETBANKING, and COD attempts.
- **Deliveries (5)**: Consignments tracked via BlueDart, Delhivery, and DTDC.
