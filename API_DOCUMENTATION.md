# REST API Documentation

This document specifies the backend REST API endpoints powering the **E-Commerce Order and Customer Analytics System**.

- **Base URL**: `http://localhost:5000/api`
- **Default Port**: `5000`
- **Content-Type**: `application/json`

---

## 1. Response Envelope Format

### Successful Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description message",
  "code": "ER_DUP_ENTRY",
  "details": []
}
```

---

## 2. System Endpoints

### `GET /health`
Verifies backend server liveness.
- **Response**: `200 OK` `{ "status": "OK", "timestamp": "..." }`

### `GET /api/system/status`
Returns database connection status, server version, and host parameters.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "serverTime": "2026-11-21T15:44:12.499Z",
    "database": {
      "name": "shop",
      "host": "127.0.0.1",
      "port": 3306,
      "user": "root",
      "connected": true,
      "version": "8.4.9"
    }
  }
}
```

### `POST /api/system/reset-seeds`
Re-executes schema, seed records, and views, safely resetting tables to original report sample data.
- **Response**: `200 OK` `{ "success": true, "message": "Database reset to seeds", "counts": { ... } }`

---

## 3. Analytics Endpoints

### `GET /api/analytics/dashboard`
Aggregates high-level KPIs and chart metrics across orders, payments, categories, and customer types.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "kpi": {
      "totalCustomers": 5,
      "totalProducts": 7,
      "totalCategories": 2,
      "totalOrders": 7,
      "totalRevenue": 11370,
      "totalSuccessfulPayments": 10570,
      "pendingOrders": 1,
      "shippedOrders": 2,
      "deliveredOrders": 3,
      "cancelledOrders": 1,
      "lowStockProducts": 1,
      "repeatCustomers": 2
    },
    "charts": {
      "revenueOverTime": [...],
      "ordersByStatus": [...],
      "bestSellers": [...],
      "revenueByCategory": [...],
      "paymentMethods": [...],
      "customerSegments": [...]
    }
  }
}
```

---

## 4. Entity CRUD Endpoints

### Customers (`/api/customers`)
- `GET /api/customers?search=aarav&page=1&limit=10&sortBy=first_name&sortOrder=ASC`: List customers with search, pagination, and sorting.
- `GET /api/customers/:id`: Fetch customer details, lifetime spend, and complete order history.
- `POST /api/customers`: Create customer (`first_name`, `last_name`, `email`, `phone`, `address`).
- `PUT /api/customers/:id`: Update customer attributes.
- `DELETE /api/customers/:id`: Delete customer. Returns `409 Conflict` if existing orders reference this customer (`ON DELETE RESTRICT`).

### Categories (`/api/categories`)
- `GET /api/categories?search=elec`: List categories with active product count.
- `GET /api/categories/:id`: Fetch category details and member products.
- `POST /api/categories`: Create category (`category_name`, `description`).
- `PUT /api/categories/:id`: Update category.
- `DELETE /api/categories/:id`: Delete category. Returns `409 Conflict` if products reference it (`ON DELETE RESTRICT`).

### Products (`/api/products`)
- `GET /api/products?category_id=1&search=cable`: List products with category names and stock.
- `GET /api/products/:id`: Fetch product details and stock status.
- `POST /api/products`: Create product. Automatically creates 1:1 `inventory` record with initial stock.
  - Body: `{ product_name, sku, unit_price, category_id, initial_stock, reorder_level }`.
- `PUT /api/products/:id`: Update product.
- `DELETE /api/products/:id`: Delete product.

### Inventory (`/api/inventory`)
- `GET /api/inventory?low_stock=true`: List inventory items with low-stock flags (`qty_on_hand <= reorder_level`).
- `GET /api/inventory/:productId`: Fetch product inventory.
- `PUT /api/inventory/:productId/adjust`: Adjust physical stock.
  - Body: `{ adjustment: -2, reason: "Manual cycle count adjustment" }`.
  - Rejects if resulting stock is negative (`CHECK qty_on_hand >= 0`).

### Discounts (`/api/discounts`)
- `GET /api/discounts`: List all promotional discount codes.
- `POST /api/discounts`: Create coupon (`code`, `discount_type`, `value`, `valid_to`).
- `GET /api/discounts/validate/:code`: Validate coupon applicability against expiration date.
- `PUT /api/discounts/:id`: Update coupon.
- `DELETE /api/discounts/:id`: Delete coupon.

### Orders (`/api/orders`)
- `GET /api/orders?status=DELIVERED&customer_id=1`: List orders with customer and delivery details.
- `GET /api/orders/:id`: Fetch order summary, line items, payment records, and shipping consignments.
- `POST /api/orders`: **ACID Transactional Order Placement**.
  - Body:
    ```json
    {
      "customer_id": 1,
      "discount_code": "SAVE10",
      "items": [
        { "product_id": 1, "quantity": 1 },
        { "product_id": 2, "quantity": 2 }
      ]
    }
    ```
  - **Transaction Workflow**:
    1. `START TRANSACTION;`
    2. Locks product and inventory rows with `SELECT ... FOR UPDATE`.
    3. Verifies stock availability (`qty_on_hand >= requested_qty`).
    4. Calculates line totals and applies coupon discount.
    5. Inserts into `orders`.
    6. Inserts into `order_items` retaining historical unit price.
    7. Decrements `inventory.qty_on_hand`.
    8. `COMMIT;` (Rolls back completely if any item is out of stock).
- `PUT /api/orders/:id/status`: Update status (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- `DELETE /api/orders/:id`: Delete order.

### Order Items (`/api/order-items`)
- `GET /api/order-items?order_id=1&product_id=2`: List line items.
- `GET /api/order-items/:orderId/:productId`: Fetch specific line item by composite PK.
- `POST /api/order-items`: Add item to order.
- `PUT /api/order-items/:orderId/:productId`: Update item quantity.
- `DELETE /api/order-items/:orderId/:productId`: Remove item.

### Payments (`/api/payments`)
- `GET /api/payments?method=UPI&status=SUCCESS`: List payment transactions.
- `POST /api/payments`: Record payment (`order_id`, `method`, `amount`, `status`, `paid_on`).
- `GET /api/payments/:id`: Fetch payment record.
- `PUT /api/payments/:id`: Update payment.
- `DELETE /api/payments/:id`: Delete payment.

### Deliveries (`/api/deliveries`)
- `GET /api/deliveries?courier=BlueDart`: List shipping consignments.
- `POST /api/deliveries`: Create delivery consignment (Enforces 1:1 with `order_id`).
- `PUT /api/deliveries/:id`: Update tracking details and dates (Synchronizes order status).
- `DELETE /api/deliveries/:id`: Delete consignment.

---

## 5. SQL Lab & Engine Diagnostics Endpoints

### Query Lab
- `GET /api/query-lab/catalog`: Retrieve all 20 predefined report queries.
- `POST /api/query-lab/predefined/:id`: Execute a predefined query by ID and return execution time and row set.
- `POST /api/query-lab/execute`: Execute arbitrary read-only SQL (`SELECT` / `WITH`).
  - Body: `{ "sql": "SELECT * FROM customers WHERE email LIKE '%@mail.com';" }`

### Views Management
- `GET /api/views`: List metadata, descriptions, and columns for `vw_order_report` and `vw_customer_type`.
- `GET /api/views/:name/data`: Query view (`SELECT * FROM {name}`).

### Index Management
- `GET /api/indexes`: List all database indexes from `information_schema.STATISTICS`.
- `POST /api/indexes/explain`: Execute `EXPLAIN {sql}` and return the execution plan matrix.

### ACID Transactions Demo
- `POST /api/transactions/demo`: Executes the multi-step transaction demonstration showcasing `START TRANSACTION`, `SAVEPOINT`, intentional constraint violation, `ROLLBACK TO SAVEPOINT`, and `COMMIT`.

### Testing & Verification
- `POST /api/testing/run-all`: Executes the 8 constraint tests and 3 consistency checks.
- `GET /api/testing/consistency`: Executes consistency validation queries A, B, and C.

### Concepts Lab
- `POST /api/concepts/ddl`: Runs DDL lifecycle (`CREATE`, `ALTER ADD`, `TRUNCATE`, `ALTER DROP`, `DROP`).
- `POST /api/concepts/dml`: Runs DML lifecycle (`INSERT`, `SELECT`, `UPDATE`, `DELETE`).
- `POST /api/concepts/dcl`: Runs DCL security lifecycle (`CREATE USER`, `GRANT`, `REVOKE`, `SHOW GRANTS`).

### Schema Architecture
- `GET /api/schema/metadata`: Introspects tables, columns, foreign keys, and relationships.
