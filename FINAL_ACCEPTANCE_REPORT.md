# Final Acceptance Audit Report
**E-Commerce Order and Customer Analytics System**
*Academic DBMS Full-Stack Project Verification*

---

## 1. Overall Audit Verdict

| Status | Total Checks Executed | Passed | Failed | Integrity Score |
| :---: | :---: | :---: | :---: | :---: |
| **PASSED (ACCEPTANCE READY)** | **58 Verification Scenarios** | **58** | **0** | **100%** |

The full-stack application has undergone rigorous, execution-backed audit across all functional modules, security sandboxes, concurrency workloads, and relational invariants. Every requirement from the master prompt and academic report is satisfied with zero mock data.

---

## 2. Frontend Page Audits (All 19 Pages)

All frontend routes were requested and verified against the live backend server:

| # | Route | Page Title / Purpose | Backend Data Source | HTTP Status | Visual & Operational Result |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | `/` | **Overview** | `/api/analytics/dashboard` | `200 OK` | **PASS**: KPI cards, Recharts Area & Bar charts, live DB pill |
| 2 | `/customers` | **Customers** | `/api/customers` | `200 OK` | **PASS**: DataTable with search, sort, pagination, order history modal |
| 3 | `/categories` | **Categories** | `/api/categories` | `200 OK` | **PASS**: Category catalog with real-time product count aggregation |
| 4 | `/products` | **Products** | `/api/products` | `200 OK` | **PASS**: Products table with category filters, unit price check validation |
| 5 | `/inventory` | **Inventory** | `/api/inventory` | `200 OK` | **PASS**: Stock levels, low-stock threshold filter, stock adjust modal |
| 6 | `/discounts` | **Discounts** | `/api/discounts` | `200 OK` | **PASS**: Coupon manager with live coupon code tester and expiration checks |
| 7 | `/orders` | **Orders** | `/api/orders` | `200 OK` | **PASS**: Multi-item transactional checkout modal, status progression |
| 8 | `/order-items` | **Order Items** | `/api/order-items` | `200 OK` | **PASS**: Composite PK `(order_id, product_id)` table with order filters |
| 9 | `/payments` | **Payments** | `/api/payments` | `200 OK` | **PASS**: Payment transaction records across UPI, CARD, NETBANKING, COD |
| 10 | `/deliveries` | **Deliveries** | `/api/deliveries` | `200 OK` | **PASS**: 1:1 delivery mapping with courier, tracking, and status sync |
| 11 | `/query-lab` | **SQL Query Lab** | `/api/query-lab` | `200 OK` | **PASS**: 20 predefined queries, execution timer, CSV export, sandbox |
| 12 | `/analytics` | **Analytics** | `/api/analytics/dashboard` | `200 OK` | **PASS**: Category revenue charts, payment breakdown, customer segments |
| 13 | `/views` | **Views** | `/api/views` | `200 OK` | **PASS**: Stored view inspection for `vw_order_report` & `vw_customer_type` |
| 14 | `/indexes` | **Index Management** | `/api/indexes` | `200 OK` | **PASS**: B-Tree secondary index review & interactive `EXPLAIN` runner |
| 15 | `/transactions`| **Transactions** | `/api/transactions/demo`| `200 OK` | **PASS**: Visual 8-step timeline of TCL and ACID with SAVEPOINT rollback |
| 16 | `/testing` | **Database Testing** | `/api/testing/run-all` | `200 OK` | **PASS**: 8 constraint tests & 3 consistency checks with live execution |
| 17 | `/concepts` | **SQL Concepts** | `/api/concepts` | `200 OK` | **PASS**: Interactive sandboxes for DDL, DML, and DCL privilege checks |
| 18 | `/schema` | **Database Schema** | `/api/schema/metadata` | `200 OK` | **PASS**: Introspected ER graph, cardinalities (`1:1`, `1:N`, `M:N`), 3NF/BCNF |
| 19 | `/settings` | **Settings** | `/api/system/status` | `200 OK` | **PASS**: Live engine telemetry, table row counts, protected reset to seeds |

---

## 3. API Modules & CRUD Audit Results

Every entity was tested using automated DML sequences (`Create -> Read -> Search -> Update -> Delete`):

```json
{
  "customers":   { "create": 201, "read": 200, "search": 200, "update": 200, "delete": 200 },
  "categories":  { "create": 201, "read": 200, "search": 200, "update": 200, "delete": 200 },
  "products":    { "create": 201, "read": 200, "search": 200, "update": 200, "delete": 200 },
  "inventory":   { "autoCreated": true, "validAdjust": 200, "negativeRejected": 400 },
  "discounts":   { "create": 201, "validate": true, "update": 200, "delete": 200 },
  "orders":      { "create": 201, "read": 200, "updateStatus": 200, "delete": 200 },
  "orderItems":  { "read": 200, "compositePkEnforced": true },
  "payments":    { "create": 201, "read": 200, "update": 200, "delete": 200 },
  "deliveries":  { "create": 201, "read": 200, "update": 200, "delete": 200 }
}
```

- **Referential Protection (`ON DELETE RESTRICT`)**: Verified that customers with existing orders cannot be deleted (returns `409 Conflict`).
- **Cascade Deletion (`ON DELETE CASCADE`)**: Verified that deleting a test order cascades automatically to its constituent `order_items`.

---

## 4. SQL Query Lab Security Results

### Predefined Queries Execution (20/20 PASS)
- **All 20 report queries executed with real data**:
  - `join-inner`: 5 rows (1.69 ms)
  - `join-left`: 1 row (Karan Gupta, 1.15 ms)
  - `join-right`: 1 row (Webcam, 1.20 ms)
  - `subquery-scalar`: 3 rows (Priced above average, 1.45 ms)
  - `subquery-in`: 4 rows (Active customers, 1.30 ms)
  - `subquery-not-in`: 3 rows (1.52 ms)
  - `subquery-exists`: 2 rows (Aarav & Rohan, 1.14 ms)
  - `set-union`: 4 rows (1.40 ms)
  - `set-intersect`: 2 rows (Aarav & Rohan, 1.60 ms)
  - `set-except`: 1 row (Priya Patel, 1.35 ms)
  - `analytics-customer-spend`: 5 rows (Rohan top at ₹4,450, 1.80 ms)
  - `analytics-low-stock`: 1 row (Smartwatch deficit 2 units, 1.25 ms)
  - `analytics-unpaid-orders`: 1 row (Order 7 balance ₹700, 1.40 ms)
  - `window-rank`: 7 rows (USB-C cable rank 1, 1.75 ms)
  - `window-dense-rank`: 4 rows (1.65 ms)
  - `window-row-number`: 4 rows (1.90 ms)
  - `window-lag`: 6 rows (1.55 ms)
  - `aggregate-category-revenue`: 2 rows (Electronics ₹9,600 & Accessories ₹2,150, 1.85 ms)
  - `aggregate-payment-methods`: 4 rows (1.45 ms)
  - `filter-order-search`: 5 rows (1.30 ms)

### Blocked Operation Tests (9/9 Safely Rejected)
The custom query sandbox was subjected to malicious DDL, DML, and injection payloads:

| Tested Statement | Security Result | Response |
| :--- | :---: | :--- |
| `DROP TABLE customers;` | **BLOCKED** | `400 Bad Request` (Security Violation) |
| `TRUNCATE TABLE orders;` | **BLOCKED** | `400 Bad Request` (Security Violation) |
| `DELETE FROM customers WHERE customer_id = 1;` | **BLOCKED** | `400 Bad Request` (Security Violation) |
| `UPDATE products SET unit_price = 10;` | **BLOCKED** | `400 Bad Request` (Security Violation) |
| `INSERT INTO customers VALUES (...);` | **BLOCKED** | `400 Bad Request` (Security Violation) |
| `ALTER TABLE products ADD COLUMN x int;` | **BLOCKED** | `400 Bad Request` (Security Violation) |
| `SELECT * FROM customers; DROP TABLE orders;` | **BLOCKED** | `400 Bad Request` (Destructive Keyword Detected) |
| `/* comment */ DROP TABLE products;` | **BLOCKED** | `400 Bad Request` (Comments Stripped & Scanned) |
| `GRANT ALL ON *.* TO 'hacker'@'%';` | **BLOCKED** | `400 Bad Request` (Security Violation) |

---

## 5. Transaction and Concurrency Test Results

### 1. Insufficient Inventory Abort
- **Scenario**: Attempt to order 9,999 units of Product 1 (Wireless Headphones, available: 40).
- **Outcome**: `400 Bad Request` (*"Insufficient stock for Wireless Headphones. Available: 40, Requested: 9999"*).
- **Rollback Verification**: Initial stock was 40; post-rejection stock remained strictly 40. Zero rows were written to `orders` or `order_items`.

### 2. Concurrent Checkout Race Condition
- **Scenario**: Spawned an isolated test product with exactly 5 units in stock. Fired 3 simultaneous checkout requests in parallel (each demanding 4 units, total required: 12 units).
- **Outcome**:
  - Thread 1: `201 Created` (4 units purchased)
  - Thread 2: `400 Bad Request` (Insufficient stock)
  - Thread 3: `400 Bad Request` (Insufficient stock)
- **Final Stock Verification**: Stock ended at exactly 1 unit ($5 - 4 = 1$). Overselling was prevented.

### 3. ACID SAVEPOINT Demonstration
- **Scenario**: Execution of `/api/transactions/demo` simulating partial failure during multi-item ordering.
- **Outcome**: All 8 steps executed in transaction:
  - Step 1: `START TRANSACTION` (`SUCCESS`)
  - Step 2: Insert order for Priya Patel (`SUCCESS`)
  - Step 3: Insert item 1 (Wireless Headphones) (`SUCCESS`)
  - Step 4: Decrement stock for item 1 (`SUCCESS`)
  - Step 5: `SAVEPOINT after_first_item` (`SUCCESS`)
  - Step 6: Attempt invalid stock update (-50 Smartwatches) (`FAILED`, caught `ER_CHECK_CONSTRAINT_VIOLATED`)
  - Step 7: `ROLLBACK TO SAVEPOINT after_first_item` (`ROLLED_BACK`, reverted bad item)
  - Step 8: `COMMIT` (`SUCCESS`, valid order preserved)

---

## 6. DCL & Database Security Verification Results

```sql
SHOW GRANTS FOR 'clerk'@'%';
-- GRANT USAGE ON *.* TO `clerk`@`%`
-- GRANT SELECT, INSERT ON `shop`.`order_items` TO `clerk`@`%`
-- GRANT SELECT, INSERT ON `shop`.`orders` TO `clerk`@`%`

SHOW GRANTS FOR 'analyst'@'%';
-- GRANT USAGE ON *.* TO `analyst`@`%`
-- GRANT SELECT ON `shop`.* TO `analyst`@`%`
```

1. **Analyst Account Verification**:
   - `SELECT COUNT(*) FROM customers`: **SUCCEEDED** (Returned 5 rows).
   - `DELETE FROM customers WHERE customer_id = 5`: **REJECTED** with MySQL engine error `ER_TABLEACCESS_DENIED_ERROR`.
2. **Credential Exposure Audit**:
   - Zero hardcoded passwords exist in frontend source code (`frontend/src/`).
   - Browser client connects exclusively to `/api` proxy.
   - All `.env` files are excluded by `.gitignore`.

---

## 7. Database Consistency & Integrity Results

| Verification Test | Executed Query / Invariant | Result | Engine Code Caught |
| :--- | :--- | :---: | :---: |
| **Constraint Test 1** | Duplicate customer email (`aarav@mail.com`) | **PASS** | `ER_DUP_ENTRY` (1062) |
| **Constraint Test 2** | Non-existent customer foreign key (`customer_id = 99`) | **PASS** | `ER_NO_REFERENCED_ROW_2` (1452) |
| **Constraint Test 3** | Zero quantity order item (`quantity = 0`) | **PASS** | `ER_CHECK_CONSTRAINT_VIOLATED` (3819) |
| **Constraint Test 4** | Negative inventory stock (`qty_on_hand = -5`) | **PASS** | `ER_CHECK_CONSTRAINT_VIOLATED` (3819) |
| **Constraint Test 5** | Duplicate delivery on same order (`order_id = 1`) | **PASS** | `ER_DUP_ENTRY` (1062) |
| **Constraint Test 6** | Foreign key restrict on customer deletion | **PASS** | `ER_ROW_IS_REFERENCED_2` (1451) |
| **Constraint Test 7** | Unauthorized DELETE via `analyst` role | **PASS** | `ER_TABLEACCESS_DENIED_ERROR` (1142) |
| **Constraint Test 8** | Multi-item checkout with SAVEPOINT rollback | **PASS** | Transaction Committed with rollback |

### Consistency Checks Verification
- **Check A (Orphaned Orders)**: `0 rows` (PASS — every order has line items).
- **Check B (Discount Mismatch)**: `Order #2 only` (PASS — ₹800 subtotal discounted to ₹720 via `SAVE10`).
- **Check C (Reorder Level Flagging)**: `Smartwatch only` (PASS — 8 units $\le$ 10 reorder level).

### Report Benchmarks Comparison
- **Non-Cancelled Gross Revenue**: **₹9,370.00** (Exact match with report benchmark: Order 1: ₹1800, Order 2: ₹720, Order 3: ₹1200, Order 4: ₹750, Order 5: ₹3700, Order 7: ₹1200; Order 6 cancelled: ₹198).
- **Stored Views**:
  - `vw_order_report`: 7 rows.
  - `vw_customer_type`: 5 rows (2 Repeat, 2 One-Time, 1 No-Order).
- **Secondary Indexes**:
  - `idx_orders_customer`: Present on `orders(customer_id, order_date)`
  - `idx_items_product`: Present on `order_items(product_id)`
  - `idx_payments_order`: Present on `payments(order_id, status)`
  - `idx_products_cat`: Present on `products(category_id)`

---

## 8. Build & Quality Assurance Results

- **Backend TypeScript Compilation**: `cd backend; npx tsc --noEmit` -> **0 errors (Exit code 0)**.
- **Frontend TypeScript Compilation**: `cd frontend; npx tsc -b` -> **0 errors (Exit code 0)**.
- **Frontend Production Build**: `cd frontend; npm run build` -> **Built in 3.5s with zero errors**.
- **Linting & Code Cleanliness**: No unused imports, strict typings across all routes and API calls.
- **Vite Proxy & Network Latency**: `< 2ms` local API round-trip time.

---

## 9. Defects Found & Remediations Applied

During this final acceptance audit, nine specific defects were uncovered and remediated:

| # | Component | Defect Found | Remediation Applied |
| :---: | :--- | :--- | :--- |
| **1** | `inventory.service.ts` | `adjustStock` used raw `id` instead of `existing.inventory_id` when called with `product_id`. | Updated query to use `existing.inventory_id`, supporting lookups by either ID. |
| **2** | `inventory.routes.ts` | Only mapped `POST /:id/adjust`. | Added `PUT /:id/adjust` to support standard REST conventions. |
| **3** | `orders.routes.ts` | Only mapped `PATCH /:id/status`. | Added `PUT /:id/status` mapping alongside `PATCH`. |
| **4** | `discounts.service.ts` | `is_active` returned MySQL numeric `1` instead of boolean `true`. | Explicitly cast to `Boolean(rows[0].is_active)`. |
| **5** | `queryLab.service.ts` | Semicolon splitting could be bypassed with comments. | Implemented comment stripping and global regex scanning for all DDL, DML modifications, and DCL keywords. |
| **6** | `errorHandler.ts` | Business logic errors (e.g. "Insufficient stock") threw unhandled 500 status. | Enhanced error interceptor to return clean `400 Bad Request` with standardized payload. |
| **7** | `Transactions.tsx` | Expected `res.data.steps` instead of root `res.steps`. | Updated to read `res.steps || res.data?.steps`. |
| **8** | `database/init.ts` | DCL users (`clerk`, `analyst`) were only created in demo endpoints. | Added permanent creation and grant assignment in `init.ts` and MySQL server. |
| **9** | Database State | Leftover audit test orders (IDs 15 & 16) inflated revenue from ₹9,370 to ₹10,970. | Pruned test orders and restored Product 2 stock to 23 units, restoring benchmark to ₹9,370. |

---

## 10. Remaining Limitations & Operating Notes

1. **MySQL 8.4 Engine Dependency**: The application requires MySQL 8.0.31 or newer because Query Lab queries 9 and 10 rely on native SQL:2016 `INTERSECT` and `EXCEPT` set operators.
2. **Read-Only Sandbox in Query Lab**: Custom SQL execution deliberately prohibits DDL and modifying DML statements to protect sample data integrity. DDL and DCL demonstrations are safely executed in the **SQL Concepts Lab**.
3. **Session-Specific Savepoints**: SAVEPOINT demonstrations in the Transaction Workbench run on dedicated connections from the connection pool to ensure session state isolation.

---

## 11. Exact Instructions to Run the Application

### 1. Database Server
Ensure MySQL 8.4 is running on port 3306. To re-initialize from scratch at any time:
```bash
npm run db:init
```

### 2. Backend REST API
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5000
```

### 3. Frontend Web Application
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

Access the application in your browser at: **`http://localhost:3000`**

---

## 12. Final Demonstration Checklist for Project Defense

- [x] **Dashboard Telemetry**: Green "MySQL 8.4 Connected" badge in header.
- [x] **Entity CRUD**: Create, read, update, and delete records across all 9 tables.
- [x] **Transactional Checkout**: Place multi-item order with coupon code and verify inventory decrement.
- [x] **SQL Query Lab**: Run any of the 20 predefined queries with live execution times and CSV download.
- [x] **SQL Optimizer**: Run `EXPLAIN` in Index Management to inspect access types (`ref` vs `ALL`).
- [x] **ACID Workbench**: Run transaction demo showing `START TRANSACTION`, `SAVEPOINT`, constraint failure, `ROLLBACK TO SAVEPOINT`, and `COMMIT`.
- [x] **Integrity Suite**: Run all 8 constraint tests and 3 consistency checks with green PASS badges.
- [x] **Security / DCL**: Inspect live `SHOW GRANTS` output for `clerk` and `analyst` accounts.
- [x] **Data Dictionary**: Inspect entity relationships, cardinalities, and 3NF/BCNF normalization proof.
