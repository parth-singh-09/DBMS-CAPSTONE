# Complete Setup & Installation Guide

This guide provides end-to-end instructions for installing and running the **E-Commerce Order and Customer Analytics System** on your local machine.

---

## 1. System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu 20.04+)
- **Node.js**: v18.0.0 or newer (v20+ recommended)
- **Package Manager**: `npm` (comes with Node.js)
- **Database Engine**: MySQL Server 8.0.31 or newer (MySQL 8.4 LTS recommended)
- **Port Availability**:
  - `3306`: MySQL database server
  - `5000`: Backend Express API server
  - `3000`: Frontend React Vite development server

---

## 2. Step 1: Database Setup (MySQL 8.4)

### Starting MySQL on Windows
Ensure MySQL 8.4 is running as a service or standalone daemon:
```powershell
# In Windows PowerShell (Administrator):
net start MySQL84
# OR if running a standalone instance:
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --port=3306 --console
```

### Option A: Automated Database Initialization (Recommended)
1. Ensure your local MySQL server is running on `127.0.0.1:3306`.
2. Configure credentials in `backend/.env` (default is user `root` with no password).
3. From the project root or backend directory, run:
   ```powershell
   # From root:
   npm run db:init

   # OR directly from backend:
   cd backend
   npm run db:init
   ```
   This script creates the database `shop`, executes `schema.sql`, inserts `seeds.sql`, creates stored views in `views.sql`, creates secondary indexes in `indexes.sql`, provisions DCL users `analyst` and `clerk`, and verifies all 9 tables.

### Option B: Manual Setup via MySQL CLI or MySQL Workbench
If you prefer executing scripts manually:
```powershell
mysql -u root -p
```
Inside the MySQL shell:
```sql
CREATE DATABASE IF NOT EXISTS shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shop;
SOURCE database/schema.sql;
SOURCE database/seeds.sql;
SOURCE database/views.sql;
SOURCE database/indexes.sql;
```

---

## 3. Step 2: Backend Setup (Express.js + TypeScript)

1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Install dependencies (if not already installed):
   ```powershell
   npm install
   ```
3. Verify `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=shop
   DB_ANALYST_USER=analyst
   DB_ANALYST_PASSWORD=Pass@123
   ```
4. Start the backend development server:
   ```powershell
   npm run dev
   # OR with tsx:
   npx tsx src/server.ts
   ```
5. Confirm backend is operational by visiting:
   [http://localhost:5000/health](http://localhost:5000/health)
   Expected response:
   ```json
   { "status": "ok", "project": "E-Commerce Order and Customer Analytics System" }
   ```

---

## 4. Step 3: Frontend Setup (React + Vite + Tailwind CSS)

1. Open a second PowerShell window and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your web browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

---

## 5. Step 4: Verification Checklist

1. **Dashboard Loading**: Navigate to `http://localhost:3000`. Verify that the top bar displays a green **"MySQL 8.4 Connected"** badge.
2. **Entity Tables**: Visit **Customers**, **Products**, and **Orders**; ensure seed records appear.
3. **Interactive Order Placement**: Go to **Orders** -> Click **"+ Create New Order"** -> Select a customer and add products -> Confirm order total is calculated dynamically -> Submit order and verify stock decrements in **Inventory**.
4. **SQL Query Lab**: Visit **SQL Query Lab** -> Select Query #1 (`INNER JOIN`) -> Click **"Run Query"** -> Verify results render in `< 5ms`.
5. **Database Testing**: Go to **Database Testing** -> Click **"Execute Test Suite"** -> Confirm all 8 constraint tests and 3 consistency checks display green **PASS** badges.

---

## 6. Troubleshooting Common Issues

### Issue 1: `ECONNREFUSED 127.0.0.1:3306`
- **Cause**: MySQL server service is stopped.
- **Solution**:
  - Windows: Start MySQL via Services (`services.msc`) or run `mysqld.exe`.
  - Linux/Mac: Run `sudo systemctl start mysql` or `brew services start mysql`.

### Issue 2: `ER_ACCESS_DENIED_ERROR (using password: NO/YES)`
- **Cause**: Password in `backend/.env` does not match your MySQL root account password.
- **Solution**: Edit `backend/.env` and update `DB_PASSWORD` to your correct MySQL password.

### Issue 3: Port `5000` or `3000` is Already in Use
- **Cause**: Another service or prior node process is occupying the port.
- **Solution**:
  - Windows:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
    ```
  - Linux/Mac:
    ```bash
    kill -9 $(lsof -t -i:5000)
    ```

### Issue 4: Vite Proxy Fails to Connect
- **Cause**: Backend server on port 5000 is not running.
- **Solution**: Ensure `npm run dev` is running inside `backend/` before launching `frontend/`.

---

## 7. Project Demonstration Sequence (Viva Presentation Guide)

Follow this structured 8-step demonstration path during project evaluations and viva voce presentations:

### Step 1: System Overview & Live Dashboard
- **URL**: `http://localhost:3000/`
- **Highlight**:
  - Live connection indicator: MySQL 8.4 on port 3306.
  - KPI metric cards: Total Revenue (₹9,370.00), Total Orders (7), Total Customers (5), Active Products (7).
  - Interactive charts powered by Recharts querying live aggregated data.

### Step 2: Database Schema & Relational Integrity
- **URL**: `http://localhost:3000/schema`
- **Highlight**:
  - Interactive ER Diagram showing 9 normalized tables.
  - Foreign key dependency graph: Customers -> Orders -> Order_Items <- Products <- Categories.
  - Primary, unique, foreign key, and CHECK constraint inspector.

### Step 3: Entity CRUD & Transactional Operations
- **URL**: `http://localhost:3000/orders` and `http://localhost:3000/inventory`
- **Highlight**:
  - Demonstrate placing a multi-item order: selects customer, dynamically computes total with discounts.
  - Backend executes order placement within an ACID transaction (`withTransaction`).
  - Switch to `/inventory` to show physical stock decrement in real-time.

### Step 4: ACID Transactions & Concurrency Simulation
- **URL**: `http://localhost:3000/transactions`
- **Highlight**:
  - **Atomic Checkout**: Demonstrates all-or-nothing execution across 4 tables.
  - **Inventory Rollback**: Simulates an out-of-stock condition and proves complete rollback with zero orphaned rows.
  - **Concurrent Checkout**: Simulates multiple clients competing for limited stock; proves `SELECT ... FOR UPDATE` row-level locking prevents overselling.
  - **SAVEPOINT Demo**: Shows partial rollback to a savepoint without aborting the entire transaction.

### Step 5: SQL Query Lab (Predefined & Custom Analytics)
- **URL**: `http://localhost:3000/query-lab`
- **Highlight**:
  - 20 Predefined Analytical Queries covering: Multi-table JOINs, Subqueries, Aggregate functions (`GROUP BY`, `HAVING`), Common Table Expressions (`WITH`), Window functions, and Views.
  - Execution time benchmark (< 5ms per analytical query).
  - Custom SQL editor with query execution plan viewer (`EXPLAIN`).
  - **Security Demonstration**: Attempt a `DROP TABLE customers;` or `INSERT INTO categories` to demonstrate defense-in-depth: rejected by both application regex and the MySQL `analyst` read-only connection pool (`multipleStatements: false`).

### Step 6: Constraint Testing & Consistency Audit
- **URL**: `http://localhost:3000/testing`
- **Highlight**:
  - Run the 8 Constraint Tests: negative prices, duplicate emails, invalid foreign keys, invalid order status. Confirm all fail at MySQL engine level as expected.
  - Run the 3 Consistency Checks: Orphaned order items, stock balance vs order totals, payment amount vs order total. Confirm 100% data consistency.

### Step 7: Stored Views & Secondary Index Analysis
- **URL**: `http://localhost:3000/views` and `http://localhost:3000/indexes`
- **Highlight**:
  - Stored Views: `vw_order_report` and `vw_customer_type` simplifying analytical access.
  - Index Inspector: Explain `idx_orders_customer`, `idx_items_product`, `idx_payments_order`, and `idx_products_cat` reducing full table scans on foreign key joins.

### Step 8: DCL Security & Privilege Verification
- **URL**: `http://localhost:3000/concepts`
- **Highlight**:
  - Role-Based Access Control (RBAC): Inspect active grants for `analyst@%` (`GRANT SELECT`) and `clerk@%` (`GRANT SELECT, INSERT ON orders, order_items`).
  - Demonstrate privilege boundaries and separation of duties.
