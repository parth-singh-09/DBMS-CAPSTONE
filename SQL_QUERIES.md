# SQL Query Catalog & Relational Operations

This document catalogs the **20 Predefined SQL Queries** implemented in the **SQL Query Lab**, complete with relational concepts, business utility explanations, tables involved, SQL statements, and expected benchmark outputs from the academic project report.

---

## Category A: Joins

### 1. INNER JOIN — Orders with Customer and Courier
- **Category**: Joins
- **Concept**: 3-Table `INNER JOIN`
- **Tables Involved**: `orders`, `customers`, `deliveries`
- **Business Utility**: Gives fulfillment teams a single consolidated view of who placed the order, the total bill, and the assigned courier.
- **SQL Statement**:
  ```sql
  SELECT o.order_id, c.first_name, o.total_amount, d.courier
  FROM orders o
  INNER JOIN customers c  ON c.customer_id = o.customer_id
  INNER JOIN deliveries d ON d.order_id = o.order_id;
  ```
- **Expected Benchmark**: Returns 5 rows (Orders 1 to 5) having assigned deliveries.

---

### 2. LEFT JOIN — Customers Who Never Ordered
- **Category**: Joins
- **Concept**: `LEFT OUTER JOIN` with `IS NULL` filter
- **Tables Involved**: `customers`, `orders`
- **Business Utility**: Identifies registered leads who have never completed a purchase for re-engagement email campaigns.
- **SQL Statement**:
  ```sql
  SELECT c.customer_id, c.first_name, c.email
  FROM customers c 
  LEFT JOIN orders o ON o.customer_id = c.customer_id
  WHERE o.order_id IS NULL;
  ```
- **Expected Benchmark**: Returns 1 row: Karan Gupta (`customer_id = 5`).

---

### 3. RIGHT JOIN — Products That Were Never Ordered
- **Category**: Joins
- **Concept**: `RIGHT OUTER JOIN` with `IS NULL` filter
- **Tables Involved**: `order_items`, `products`
- **Business Utility**: Detects dead inventory or unmarketed products that occupy warehouse space without generating sales.
- **SQL Statement**:
  ```sql
  SELECT p.product_id, p.product_name, p.unit_price
  FROM order_items oi
  RIGHT JOIN products p ON p.product_id = oi.product_id
  WHERE oi.product_id IS NULL;
  ```
- **Expected Benchmark**: Returns 1 row: Webcam (`product_id = 7`).

---

## Category B: Subqueries

### 4. Scalar Subquery — Products Priced Above Catalog Average
- **Category**: Subqueries
- **Concept**: Scalar subquery in `WHERE` clause
- **Tables Involved**: `products`
- **Business Utility**: Flags premium inventory priced above the store catalog average for targeted marketing.
- **SQL Statement**:
  ```sql
  SELECT product_id, product_name, unit_price
  FROM products
  WHERE unit_price > (SELECT AVG(unit_price) FROM products)
  ORDER BY unit_price DESC;
  ```
- **Expected Benchmark**: Returns products priced above ₹1314.29 (Mechanical Keyboard, Smartwatch, Wireless Headphones).

---

### 5. Subquery with IN — Customers Who Placed at Least One Order
- **Category**: Subqueries
- **Concept**: Subquery with `IN` operator
- **Tables Involved**: `customers`, `orders`
- **Business Utility**: Segments converted active buyers from inactive user registrations.
- **SQL Statement**:
  ```sql
  SELECT customer_id, first_name, email
  FROM customers
  WHERE customer_id IN (SELECT DISTINCT customer_id FROM orders);
  ```
- **Expected Benchmark**: Returns Aarav, Priya, Rohan, and Sneha (4 active customers).

---

### 6. Subquery with NOT IN — Products Never Purchased by Customer 1
- **Category**: Subqueries
- **Concept**: Subquery with `NOT IN` operator
- **Tables Involved**: `products`, `order_items`, `orders`
- **Business Utility**: Recommendation engine feed: discovers catalog items that a specific customer has not yet tried.
- **SQL Statement**:
  ```sql
  SELECT product_id, product_name
  FROM products
  WHERE product_id NOT IN (
    SELECT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.customer_id = 1
  );
  ```
- **Expected Benchmark**: Products not purchased by Aarav (Mechanical Keyboard, Smartwatch, Webcam).

---

### 7. Correlated Subquery with EXISTS — High-Value Order Customers
- **Category**: Subqueries
- **Concept**: Correlated subquery with `EXISTS`
- **Tables Involved**: `customers`, `orders`
- **Business Utility**: Identifies VIP patrons who have placed single high-value purchases exceeding ₹2000.
- **SQL Statement**:
  ```sql
  SELECT c.customer_id, c.first_name, c.email
  FROM customers c
  WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.customer_id AND o.total_amount > 2000
  );
  ```
- **Expected Benchmark**: Returns Aarav Sharma (Order 1: ₹3000) and Rohan Mehta (Order 4: ₹4450).

---

## Category C: Set Operations

### 8. UNION — All Unique Customers with Activity
- **Category**: Set Operations
- **Concept**: `UNION` (Combines result sets removing duplicates)
- **Tables Involved**: `customers`, `orders`, `payments`
- **Business Utility**: Merges customer segments from ordering and payment channels into a single deduplicated list.
- **SQL Statement**:
  ```sql
  SELECT customer_id, 'Placed Order' AS activity_type FROM orders
  UNION
  SELECT o.customer_id, 'Made Payment' AS activity_type FROM payments p JOIN orders o ON o.order_id = p.order_id;
  ```
- **Expected Benchmark**: Deduplicated list of converted customers with activity.

---

### 9. INTERSECT — Customers Who Purchased in Multiple Categories
- **Category**: Set Operations
- **Concept**: Native MySQL 8.0.31+ `INTERSECT`
- **Tables Involved**: `orders`, `order_items`, `products`
- **Business Utility**: Identifies cross-category shoppers who bought both Electronics (`category_id = 1`) and Accessories (`category_id = 2`).
- **SQL Statement**:
  ```sql
  SELECT o.customer_id
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE p.category_id = 1
  INTERSECT
  SELECT o.customer_id
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE p.category_id = 2;
  ```
- **Expected Benchmark**: Returns Aarav Sharma (customer 1) and Rohan Mehta (customer 3).

---

### 10. EXCEPT — Customers Who Bought Electronics But Never Accessories
- **Category**: Set Operations
- **Concept**: Native MySQL 8.0.31+ `EXCEPT`
- **Tables Involved**: `orders`, `order_items`, `products`
- **Business Utility**: Identifies single-category shoppers for targeted cross-selling campaigns.
- **SQL Statement**:
  ```sql
  SELECT o.customer_id
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE p.category_id = 1
  EXCEPT
  SELECT o.customer_id
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE p.category_id = 2;
  ```
- **Expected Benchmark**: Returns Priya Patel (customer 2), who purchased Wireless Headphones and Smartwatch but never Accessories.

---

## Category D: Business Analytics

### 11. Lifetime Spend per Customer Ranking
- **Category**: Business Analytics
- **Concept**: `SUM()`, `COUNT()`, `GROUP BY`, `ORDER BY DESC`
- **Tables Involved**: `customers`, `orders`
- **Business Utility**: Evaluates Customer Lifetime Value (CLV) to prioritize high-value accounts.
- **SQL Statement**:
  ```sql
  SELECT c.customer_id, c.first_name, c.last_name,
         COUNT(o.order_id) AS total_orders,
         IFNULL(SUM(o.total_amount), 0) AS lifetime_spend
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status <> 'CANCELLED'
  GROUP BY c.customer_id, c.first_name, c.last_name
  ORDER BY lifetime_spend DESC;
  ```
- **Expected Benchmark**: Rohan Mehta (₹4450), Aarav Sharma (₹3720), Priya Patel (₹2500), Sneha Rao (₹700), Karan Gupta (₹0).

---

### 12. Low Stock Warehouse Replenishment Alert
- **Category**: Business Analytics
- **Concept**: Filtering with column-to-column comparison
- **Tables Involved**: `inventory`, `products`, `categories`
- **Business Utility**: Alerts warehouse managers when inventory drops to or below the reorder point.
- **SQL Statement**:
  ```sql
  SELECT p.product_name, c.category_name, i.qty_on_hand, i.reorder_level,
         (i.reorder_level - i.qty_on_hand) AS deficit
  FROM inventory i
  JOIN products p ON p.product_id = i.product_id
  JOIN categories c ON c.category_id = p.category_id
  WHERE i.qty_on_hand <= i.reorder_level;
  ```
- **Expected Benchmark**: Smartwatch (8 on hand vs 10 reorder level, deficit = 2 units).

---

### 13. Unpaid or Partially Paid Orders
- **Category**: Business Analytics
- **Concept**: `LEFT JOIN` with `HAVING` deficit check
- **Tables Involved**: `orders`, `customers`, `payments`
- **Business Utility**: Accounts receivable audit to follow up on pending or failed customer invoices.
- **SQL Statement**:
  ```sql
  SELECT o.order_id, c.first_name, o.total_amount,
         IFNULL(SUM(p.amount), 0) AS amount_paid,
         (o.total_amount - IFNULL(SUM(p.amount), 0)) AS balance_due
  FROM orders o
  JOIN customers c ON c.customer_id = o.customer_id
  LEFT JOIN payments p ON p.order_id = o.order_id AND p.status = 'SUCCESS'
  WHERE o.status <> 'CANCELLED'
  GROUP BY o.order_id, c.first_name, o.total_amount
  HAVING balance_due > 0;
  ```
- **Expected Benchmark**: Order 7 (Sneha Rao, balance due: ₹700).

---

## Category E: Advanced Window Functions

### 14. RANK() — Best Selling Products by Units Sold
- **Category**: Advanced SQL
- **Concept**: `RANK() OVER (ORDER BY ... DESC)`
- **Tables Involved**: `order_items`, `products`
- **Business Utility**: Generates product popularity leaderboard with rank skips on ties.
- **SQL Statement**:
  ```sql
  SELECT p.product_name,
         SUM(oi.quantity) AS total_units,
         RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS sales_rank
  FROM order_items oi
  JOIN products p ON p.product_id = oi.product_id
  GROUP BY p.product_id, p.product_name;
  ```
- **Expected Benchmark**: Rank 1: USB-C Cable (7 units), Rank 2: Wireless Headphones (3 units).

---

### 15. DENSE_RANK() — Customer Spend Dense Ranking
- **Category**: Advanced SQL
- **Concept**: `DENSE_RANK() OVER (ORDER BY ... DESC)`
- **Tables Involved**: `customers`, `orders`
- **Business Utility**: Customer loyalty tiering without rank gaps when multiple customers have equal spend.
- **SQL Statement**:
  ```sql
  SELECT c.first_name,
         SUM(o.total_amount) AS total_spent,
         DENSE_RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS tier_rank
  FROM customers c
  JOIN orders o ON o.customer_id = c.customer_id
  WHERE o.status <> 'CANCELLED'
  GROUP BY c.customer_id, c.first_name;
  ```

---

### 16. ROW_NUMBER() OVER (PARTITION BY) — Latest Order per Customer
- **Category**: Advanced SQL
- **Concept**: `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC)`
- **Tables Involved**: `orders`, `customers`
- **Business Utility**: Retrieves each customer's most recent order for customer service workflows.
- **SQL Statement**:
  ```sql
  WITH RankedOrders AS (
    SELECT o.order_id, o.customer_id, o.order_date, o.total_amount,
           ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.order_date DESC, o.order_id DESC) AS rn
    FROM orders o
  )
  SELECT c.first_name, r.order_id, r.order_date, r.total_amount
  FROM RankedOrders r
  JOIN customers c ON c.customer_id = r.customer_id
  WHERE r.rn = 1;
  ```

---

### 17. LAG() — Order Gap Analysis
- **Category**: Advanced SQL
- **Concept**: `LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)`
- **Tables Involved**: `orders`
- **Business Utility**: Analyzes the purchase interval in days between repeat orders.
- **SQL Statement**:
  ```sql
  SELECT order_id, customer_id, order_date,
         LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS previous_order_date,
         DATEDIFF(order_date, LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)) AS days_between_orders
  FROM orders
  WHERE status <> 'CANCELLED';
  ```

---

## Category F: Aggregates & Grouping

### 18. Category Revenue with GROUP BY & HAVING
- **Category**: Aggregates
- **Concept**: `GROUP BY` and `HAVING SUM() > threshold`
- **Tables Involved**: `categories`, `products`, `order_items`, `orders`
- **Business Utility**: Filters categories generating substantial volume (e.g. revenue > ₹2000).
- **SQL Statement**:
  ```sql
  SELECT c.category_name,
         COUNT(DISTINCT o.order_id) AS orders_count,
         SUM(oi.quantity) AS total_units_sold,
         SUM(oi.quantity * oi.unit_price) AS gross_revenue
  FROM categories c
  JOIN products p ON p.category_id = c.category_id
  JOIN order_items oi ON oi.product_id = p.product_id
  JOIN orders o ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
  GROUP BY c.category_id, c.category_name
  HAVING gross_revenue > 2000;
  ```
- **Expected Benchmark**: Electronics (revenue: ₹9600) and Accessories (revenue: ₹2150).

---

### 19. Average Order Value by Payment Method
- **Category**: Aggregates
- **Concept**: `AVG()`, `COUNT()`, `GROUP BY`
- **Tables Involved**: `payments`
- **Business Utility**: Reveals preferred transaction channels and average ticket sizes.
- **SQL Statement**:
  ```sql
  SELECT method,
         COUNT(*) AS total_transactions,
         ROUND(AVG(amount), 2) AS avg_transaction_value,
         SUM(amount) AS total_volume
  FROM payments
  WHERE status = 'SUCCESS'
  GROUP BY method
  ORDER BY total_volume DESC;
  ```

---

## Category G: Filtering & Sorting

### 20. Multi-Criteria Order Search & Sort
- **Category**: Filtering
- **Concept**: Multi-column `WHERE` with `ORDER BY ASC, DESC`
- **Tables Involved**: `orders`, `customers`
- **Business Utility**: General operational listing used by warehouse supervisors.
- **SQL Statement**:
  ```sql
  SELECT o.order_id, c.first_name, c.last_name, o.order_date, o.status, o.total_amount
  FROM orders o
  JOIN customers c ON c.customer_id = o.customer_id
  WHERE o.status IN ('SHIPPED', 'DELIVERED') AND o.total_amount >= 500
  ORDER BY o.order_date DESC, o.total_amount DESC;
  ```
- **Expected Benchmark**: Returns fulfilled orders sorted chronologically and by order size.
