# E-Commerce Order and Customer Analytics System

A production-grade, enterprise-styled full-stack database application built for an academic DBMS project. This system demonstrates core and advanced relational database concepts—**3NF/BCNF normalization, primary and foreign key constraints, CHECK and UNIQUE constraints, SQL views, secondary B-Tree indexing with query execution plans (`EXPLAIN`), ACID multi-statement transactions with savepoints, and role-based access control (DCL)**—through a modern web interface.

---

## 🌟 Key Features & Academic Modules

### 1. Relational Entity Management (CRUD on 9 Tables)
Full management interfaces for all normalized tables:
- **`customers`**: Search, sort, email uniqueness check, order history inspection.
- **`categories`**: Product count aggregation, category creation.
- **`products`**: Category foreign key mapping, unit price check (`unit_price > 0`), automatic 1:1 inventory record generation.
- **`inventory`**: Real-time stock tracking, low-stock threshold alerts (`qty_on_hand <= reorder_level`), stock adjustments with negative balance prevention (`qty_on_hand >= 0`).
- **`discounts`**: Coupon validator, type enforcement (`PERCENT` vs `FLAT`), expiration date checks.
- **`orders`**: ACID transactional order placement with multiple line items, real-time inventory row-locking (`SELECT ... FOR UPDATE`), coupon discount calculation, and status progression (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- **`order_items`**: Composite primary key `(order_id, product_id)`, historical unit price retention.
- **`payments`**: Payment reconciliation across UPI, CARD, NETBANKING, and COD.
- **`deliveries`**: 1:1 delivery mapping with UNIQUE `order_id` constraint, tracking numbers, and automated order status synchronization.

### 2. SQL Query Lab (20 Predefined Queries)
An interactive query workbench pre-loaded with the 20 analytical and operational queries from the academic report:
- **Joins**: 3-Table `INNER JOIN`, `LEFT JOIN` (Customers without orders), `RIGHT JOIN` (Unordered products).
- **Subqueries**: Scalar subquery, correlated subquery (`EXISTS`), `IN`, and `NOT IN`.
- **Set Operations**: `UNION`, `INTERSECT`, and `EXCEPT`.
- **Business Analytics**: High-value repeat customer extraction, low-stock reorder alerts, unpaid order tracking.
- **Advanced Window Functions**: `RANK()`, `DENSE_RANK()`, `ROW_NUMBER()`, `LAG()`, and `PARTITION BY`.
- **Aggregates & Grouping**: `GROUP BY`, `HAVING`, `COUNT`, `SUM`, `AVG`.
- Includes live execution timer (ms), returned row count, editable SQL sandbox, and CSV export.

### 3. Database Views Management
Query and inspect database virtual tables:
- **`vw_order_report`**: Multi-table joined order fulfillment and payment reconciliation report.
- **`vw_customer_type`**: Customer RFM segmentation classifying buyers into `REPEAT`, `ONE-TIME`, and `NO ORDER`.

### 4. Index Management & EXPLAIN Optimizer
- In-depth review of the 4 secondary B-Tree indexes:
  - `idx_orders_customer` on `orders(customer_id, order_date)`
  - `idx_items_product` on `order_items(product_id)`
  - `idx_payments_order` on `payments(order_id, status)`
  - `idx_products_cat` on `products(category_id)`
- Interactive `EXPLAIN` query runner displaying the MySQL Optimizer's access types (`ref`, `eq_ref`, `ALL`), evaluated keys, row scans, and performance diagnostics.

### 5. ACID Transaction Management Workbench
- Demonstrates Transaction Control Language (TCL): `START TRANSACTION`, `SAVEPOINT`, `ROLLBACK TO SAVEPOINT`, and `COMMIT`.
- Tests an intentional failure scenario where an item exceeding available inventory violates a `CHECK (qty_on_hand >= 0)` constraint, rolling back to savepoint while committing preceding valid items.

### 6. Automated Database Testing & Integrity Checks
- **8 Constraint Verification Tests**:
  1. Duplicate customer email (`ER_DUP_ENTRY`)
  2. Foreign key violation on order creation (`ER_NO_REFERENCED_ROW_2`)
  3. Foreign key restrict violation on category deletion (`ER_ROW_IS_REFERENCED_2`)
  4. Check constraint on unit price (`ER_CHECK_CONSTRAINT_VIOLATED`)
  5. Check constraint on negative stock (`ER_CHECK_CONSTRAINT_VIOLATED`)
  6. Composite primary key duplicate on order items (`ER_DUP_ENTRY`)
  7. 1:1 UNIQUE constraint on deliveries (`ER_DUP_ENTRY`)
  8. Role-based permission denied on read-only account (`ER_TABLEACCESS_DENIED_ERROR`)
- **3 Consistency Validation Checks**:
  - Check A: Orphaned orders check (0 rows)
  - Check B: Order 2 discount mismatch verification
  - Check C: Low-stock threshold verification (Smartwatch)

### 7. SQL Concepts Lab (DDL, DML, DCL)
- **DDL**: Safe schema lifecycle demo (`CREATE`, `ALTER ADD`, `TRUNCATE`, `ALTER DROP`, `DROP`).
- **DML**: Row manipulation demo (`INSERT`, `SELECT`, `UPDATE`, `DELETE`).
- **DCL**: User creation and privilege management (`CREATE USER`, `GRANT`, `REVOKE`, `SHOW GRANTS`) demonstrating `clerk` and `analyst` roles.

### 8. Interactive Schema Visualizer & Data Dictionary
- Entity relationship graph with explicit cardinality tags:
  - Customer → Orders (`1:N`)
  - Orders ↔ Products (`M:N` via `order_items`)
  - Category → Products (`1:N`)
  - Product → Inventory (`1:1`)
  - Discount → Orders (`1:N`)
  - Orders → Payments (`1:N`)
  - Orders → Deliveries (`1:1`)
- Data dictionary inspector showing nullability, default values, primary keys, and foreign keys.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, React Hook Form, Zod |
| **Backend** | Node.js, Express.js, TypeScript (ESM), mysql2/promise Connection Pool, Zod Request Validation |
| **Database** | MySQL 8.0.31+ / MySQL 8.4 Enterprise Storage Engine (InnoDB), 3NF/BCNF Schema |
| **Architecture** | RESTful Client-Server (No direct browser-to-MySQL connection) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18.0+
- MySQL 8.0.31+ or MySQL 8.4 Server running on port 3306

### 1. Database Setup
```bash
# Initialize schema, seeds, views, and indexes
npm run db:init
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
# Server starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Web application starts on http://localhost:3000
```

Open your browser at `http://localhost:3000` to access the full application.

---

## 📚 Project Documentation Suite

Detailed documentation is available in the repository root:
1. [PROJECT_STRUCTURE.md](file:///c:/Users/krish/Downloads/frontend-DBMS/PROJECT_STRUCTURE.md) — Directory layout and component architecture.
2. [DATABASE_SCHEMA.md](file:///c:/Users/krish/Downloads/frontend-DBMS/DATABASE_SCHEMA.md) — ER diagrams, table schemas, normalization, and constraints.
3. [API_DOCUMENTATION.md](file:///c:/Users/krish/Downloads/frontend-DBMS/API_DOCUMENTATION.md) — REST API endpoint reference and payload specifications.
4. [SQL_QUERIES.md](file:///c:/Users/krish/Downloads/frontend-DBMS/SQL_QUERIES.md) — The 20 predefined queries with business utilities and expected outputs.
5. [SETUP_GUIDE.md](file:///c:/Users/krish/Downloads/frontend-DBMS/SETUP_GUIDE.md) — Complete environment configuration and installation steps.
6. [TESTING_GUIDE.md](file:///c:/Users/krish/Downloads/frontend-DBMS/TESTING_GUIDE.md) — Database verification, constraint tests, and viva defense scenarios.
7. [ENVIRONMENT_VARIABLES.md](file:///c:/Users/krish/Downloads/frontend-DBMS/ENVIRONMENT_VARIABLES.md) — Backend and frontend environment variables guide.
