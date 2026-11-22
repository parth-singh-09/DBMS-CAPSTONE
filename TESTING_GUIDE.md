# Database Testing Guide & Viva Defense Scenarios

This document details the database testing methodology, constraint validation tests, consistency verification checks, and academic viva defense questions for the **E-Commerce Order and Customer Analytics System**.

---

## 1. Testing Relational Database Invariants

In software engineering, testing standard business logic verifies that valid inputs produce expected outputs. In **Database Management Systems (DBMS)**, integrity testing additionally verifies that:
1. **Invalid or inconsistent data is strictly rejected by the database engine**, preventing corrupt state.
2. **Entity, Referential, Domain, and User-Defined constraints** are enforced at the storage engine level, independent of application code.
3. **Transaction Control Language (TCL)** guarantees ACID properties under failure conditions.

---

## 2. The Eight Constraint Verification Tests

All 8 tests are automated and executable through the web UI under **Database Testing** (`/testing`):

| Test # | Test Name | Tested Statement | Expected MySQL Error Code | Target Invariant / Constraint |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Duplicate customer email | `INSERT INTO customers (email) VALUES ('aarav@mail.com')` | `ER_DUP_ENTRY` (1062) | **Entity Integrity**: `email` is defined as UNIQUE. Prevents duplicate customer registration. |
| **2** | Foreign key violation on order creation | `INSERT INTO orders (customer_id) VALUES (99)` | `ER_NO_REFERENCED_ROW_2` (1452) | **Referential Integrity**: An order cannot reference a non-existent customer ID. |
| **3** | Check constraint on order line quantity | `INSERT INTO order_items (quantity) VALUES (0)` | `ER_CHECK_CONSTRAINT_VIOLATED` (3819) | **Domain Integrity**: `CHECK (quantity > 0)` prevents phantom zero-quantity items. |
| **4** | Check constraint on negative inventory | `UPDATE inventory SET qty_on_hand = -5 WHERE product_id = 1` | `ER_CHECK_CONSTRAINT_VIOLATED` (3819) | **Domain Integrity**: `CHECK (qty_on_hand >= 0)` guarantees that warehouse stock cannot drop below zero. |
| **5** | Duplicate delivery consignment for order | `INSERT INTO deliveries (order_id) VALUES (1)` | `ER_DUP_ENTRY` (1062) | **Relational Cardinality**: `order_id` in `deliveries` is UNIQUE. Strictly enforces 1:1 relationship between orders and deliveries. |
| **6** | Foreign key restrict on customer deletion | `DELETE FROM customers WHERE customer_id = 1` | `ER_ROW_IS_REFERENCED_2` (1451) | **Referential Integrity**: `ON DELETE RESTRICT` protects audit trails by preventing customer deletion while active orders exist. |
| **7** | Unauthorized deletion via read-only role | `DELETE FROM customers WHERE customer_id = 5` (as `analyst`) | `ER_TABLEACCESS_DENIED_ERROR` (1142) | **Database Security (DCL)**: Tests role-based access control; `analyst` only possesses `SELECT` privilege on `shop.*`. |
| **8** | Transaction savepoint & partial rollback | `SAVEPOINT` followed by invalid stock update and `ROLLBACK TO SAVEPOINT` | `SUCCESS` (Caught & Rolled Back) | **ACID Atomicity**: Reverts erroneous operations without aborting preceding valid order lines. |

---

## 3. The Three Data Consistency Checks

### Consistency Check A: Orphaned Orders Check
```sql
SELECT o.order_id 
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.order_id 
WHERE i.order_id IS NULL;
```
- **Benchmark**: Returns **0 rows**.
- **Explanation**: Confirms referential completeness. Every order in the system must contain at least one valid line item.

### Consistency Check B: Order Total vs Item Sum Discrepancy
```sql
SELECT o.order_id, o.total_amount, SUM(i.quantity * i.unit_price) AS items_total
FROM orders o 
JOIN order_items i ON i.order_id = o.order_id
GROUP BY o.order_id, o.total_amount
HAVING o.total_amount <> SUM(i.quantity * i.unit_price);
```
- **Benchmark**: Returns exactly **1 row: Order #2** (Customer Priya Patel).
- **Explanation**: Order 2 has a subtotal of ₹800 ($1 \times 800$), but its `total_amount` is ₹720 because the 10% discount coupon `SAVE10` was applied. All non-discounted orders match their line item totals exactly.

### Consistency Check C: Low Stock Threshold Flagging
```sql
SELECT p.product_name, v.qty_on_hand, v.reorder_level
FROM inventory v 
JOIN products p ON p.product_id = v.product_id
WHERE v.qty_on_hand <= v.reorder_level;
```
- **Benchmark**: Returns exactly **1 product: Smartwatch** (`qty_on_hand: 8 <= reorder_level: 10`).
- **Explanation**: Confirms that warehouse inventory monitoring functions accurately to trigger automated supplier reorders.

---

## 4. Academic Viva Defense Q&A Cheatsheet

### Q1: Why does `order_items` have a composite primary key `(order_id, product_id)`?
> **Answer**: In relational database theory, an order item represents an associative entity resolving the Many-to-Many (`M:N`) relationship between `orders` and `products`. The composite primary key `(order_id, product_id)` guarantees that a product cannot be inserted twice as separate lines in the same order; instead, its quantity attribute should be updated.

### Q2: Why store `unit_price` in both `products` and `order_items`? Doesn't this violate 3NF?
> **Answer**: No, this is an intentional design pattern known as **preserving historical transaction state**. `products.unit_price` represents the *current catalog price*, which can change over time due to inflation or pricing updates. `order_items.unit_price` stores the *historical price charged at the moment of purchase*. If we only stored `unit_price` in `products`, altering a product's catalog price would retroactively and corruptly alter the financial totals of historical past orders.

### Q3: How do secondary B-Tree indexes improve query performance, and what is their drawback?
> **Answer**: Secondary indexes (such as `idx_orders_customer` on `orders(customer_id)`) build a balanced search tree (B-Tree). Without an index, finding all orders for a customer requires a full table scan ($O(N)$ disk I/O reads). With a B-Tree index, the database engine performs an index seek in $O(\log N)$ time. The trade-off is **write overhead**: every `INSERT`, `UPDATE`, or `DELETE` on the indexed table requires modifying both the table data page and the index tree, which consumes additional disk space and CPU cycles.

### Q4: What is the difference between `ON DELETE CASCADE` and `ON DELETE RESTRICT` in your schema?
> **Answer**:
> - `ON DELETE CASCADE` is applied to `order_items(order_id)`. If an order is deleted, its constituent line items have no independent meaning and are automatically pruned.
> - `ON DELETE RESTRICT` is applied to `orders(customer_id)` and `products(category_id)`. If an administrator tries to delete a customer who has existing orders, MySQL blocks the operation with `ER_ROW_IS_REFERENCED_2` to maintain financial audit integrity.

### Q5: Explain how savepoints enable partial rollback in an e-commerce checkout flow.
> **Answer**: In standard transaction processing, an unhandled error rolls back the entire transaction. With `SAVEPOINT savepoint_name`, an application can establish intermediate checkpoints. For example, if a multi-item cart has 2 valid in-stock items and 1 out-of-stock item, the checkout service can execute `ROLLBACK TO SAVEPOINT` after the failed item, discarding only the invalid update, and proceed to `COMMIT` the remaining in-stock items.

### Q6: How do database views provide logical data independence?
> **Answer**: A view (such as `vw_order_report`) provides an abstract virtual representation of data by pre-joining tables and filtering columns. Applications and business analysts query the view without needing to know the underlying table structures or join paths. If the database schema is refactored (e.g. splitting columns into new tables), the view definition can be updated while maintaining the exact same schema contract for client applications.
