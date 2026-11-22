# Project Directory Structure

This document outlines the complete directory layout and component architecture of the **E-Commerce Order and Customer Analytics System**.

```
frontend-DBMS/
├── database/                   # Database scripts and migration utilities
│   ├── schema.sql              # DDL schema definition for 9 tables
│   ├── seeds.sql               # Initial sample data from project report
│   ├── views.sql               # Stored views (vw_order_report, vw_customer_type)
│   ├── indexes.sql             # Secondary B-Tree index definitions
│   └── init.ts                 # Database initialization runner script
│
├── backend/                    # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts     # mysql2 connection pool and connection test
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts # MySQL error code translator & Zod handler
│   │   │   └── validate.ts     # Zod request validation middleware
│   │   ├── modules/            # Modular feature domains (Controller-Service-Routes)
│   │   │   ├── analytics/      # Business KPIs, revenue, charts aggregation
│   │   │   ├── categories/     # Category CRUD & product counts
│   │   │   ├── concepts/       # DDL, DML, and DCL security sandboxes
│   │   │   ├── customers/      # Customer CRUD & purchase history
│   │   │   ├── deliveries/     # Delivery logistics & status synchronization
│   │   │   ├── discounts/      # Discount codes & coupon validation
│   │   │   ├── indexes/        # Index introspection & EXPLAIN runner
│   │   │   ├── inventory/      # Stock tracking, low-stock alerts & adjustments
│   │   │   ├── orderItems/     # Composite PK line items management
│   │   │   ├── orders/         # ACID transactional order placement
│   │   │   ├── payments/       # Payment records & reconciliation
│   │   │   ├── products/       # Products & category mapping
│   │   │   ├── queryLab/       # 20 Predefined queries catalog & SQL runner
│   │   │   ├── schema/         # information_schema introspection & ER graph
│   │   │   ├── system/         # Connection health & database reset to seeds
│   │   │   ├── testing/        # 8 Constraint tests & 3 consistency checks
│   │   │   └── views/          # Views querying and definition metadata
│   │   ├── routes.ts           # Central API route registration
│   │   └── server.ts           # Express server entry point (Port 5000)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/                   # React 18 + Vite + TypeScript Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable presentation components
│   │   │   ├── ConfirmationDialog.tsx # Accessible modal for destructive actions
│   │   │   ├── DataTable.tsx          # Generic table with search, sort & pagination
│   │   │   ├── Modal.tsx              # Universal modal with backdrop & esc handling
│   │   │   ├── QueryResultTable.tsx   # Dynamic tabular renderer for SQL results
│   │   │   ├── SQLCodeEditor.tsx      # Syntax-highlighted SQL editor with copy
│   │   │   ├── StatCard.tsx           # Dashboard KPI indicator card
│   │   │   └── StatusBadge.tsx        # Colored status pills for orders/payments
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx   # Enterprise dark sidebar, topbar & DB connection pill
│   │   ├── pages/              # Routed feature views
│   │   │   ├── Analytics.tsx          # Relational charts & customer segmentation
│   │   │   ├── Categories.tsx         # Category management
│   │   │   ├── Customers.tsx          # Customer profiles & order histories
│   │   │   ├── DatabaseSchema.tsx     # Interactive ER graph & data dictionary
│   │   │   ├── DatabaseTesting.tsx    # 8 Constraint tests & 3 consistency checks
│   │   │   ├── Deliveries.tsx         # Delivery tracking & order sync
│   │   │   ├── Discounts.tsx          # Coupons & promotional discount management
│   │   │   ├── IndexManagement.tsx    # B-Tree index review & EXPLAIN runner
│   │   │   ├── Inventory.tsx          # Warehouse stock & reorder alert manager
│   │   │   ├── OrderItems.tsx         # Composite PK line item editor
│   │   │   ├── Orders.tsx             # Multi-item transactional order builder
│   │   │   ├── Overview.tsx           # Dashboard with summary metrics & charts
│   │   │   ├── Payments.tsx           # Payment records & reconciliation
│   │   │   ├── Products.tsx           # Product catalog & pricing
│   │   │   ├── QueryLab.tsx           # 20 Predefined SQL queries lab & sandbox
│   │   │   ├── Settings.tsx           # Database telemetry & seed reset
│   │   │   ├── SqlConcepts.tsx        # DDL, DML, and DCL interactive demos
│   │   │   ├── Transactions.tsx       # ACID multi-step TCL workbench
│   │   │   └── Views.tsx              # Stored views browser (vw_order_report, etc.)
│   │   ├── services/
│   │   │   └── api.ts          # Typed Axios client matching all backend endpoints
│   │   ├── types/
│   │   │   └── index.ts        # Full TypeScript interface definitions
│   │   ├── App.tsx             # React Router route declarations
│   │   ├── index.css           # Tailwind CSS directives & custom scrollbars
│   │   └── main.tsx            # React application bootstrap
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts          # Vite proxy forwarding /api to port 5000
│
├── README.md                   # Project overview & feature summary
├── PROJECT_STRUCTURE.md        # File & architectural layout (this file)
├── DATABASE_SCHEMA.md          # Complete ER model, schema, normalization
├── API_DOCUMENTATION.md        # Comprehensive REST API reference
├── SQL_QUERIES.md              # 20 Predefined SQL queries with explanations
├── SETUP_GUIDE.md              # Detailed local installation instructions
├── TESTING_GUIDE.md            # Constraint verification & viva defense guide
└── ENVIRONMENT_VARIABLES.md    # Configuration variables reference
```

---

## Architecture & Design Patterns

### 1. Modular Monolith Backend
The backend separates concerns using the Controller-Service-Repository pattern within domain-specific modules:
- **`*.controller.ts`**: Handles HTTP requests, extracts parameters, and delegates to the service layer.
- **`*.service.ts`**: Contains business logic, manages SQL transactions, and executes queries via `mysql2/promise`.
- **`*.routes.ts`**: Registers express endpoints with validation middleware.
- **`*.schemas.ts`**: Defines Zod validation schemas for request bodies and query parameters.

### 2. Parameterized Query Security
Every dynamic SQL operation in the backend utilizes parameterized queries (`?` placeholders) executed via `conn.query(sql, params)`. This prevents SQL injection attacks across all search, filter, and CRUD endpoints.

### 3. MySQL Error Interceptor
`backend/src/middleware/errorHandler.ts` intercepts low-level MySQL error codes and translates them into user-friendly responses:
- `ER_DUP_ENTRY` (1062) → `409 Conflict`: Reports which unique key or email was duplicated.
- `ER_NO_REFERENCED_ROW_2` (1452) → `400 Bad Request`: Identifies invalid foreign key references.
- `ER_ROW_IS_REFERENCED_2` (1451) → `409 Conflict`: Explains that dependent records prevent deletion (`ON DELETE RESTRICT`).
- `ER_CHECK_CONSTRAINT_VIOLATED` (3819) → `400 Bad Request`: Explains which domain invariant (e.g. `unit_price > 0`, `qty_on_hand >= 0`) was violated.
- `ER_TABLEACCESS_DENIED_ERROR` (1142) → `403 Forbidden`: Reports database permission denial (tested in DCL).

### 4. Client-Server Decoupling
The browser communicates exclusively via JSON REST endpoints over HTTP to the backend server. The backend handles MySQL pool connections, credential management, and transactional atomicity.
