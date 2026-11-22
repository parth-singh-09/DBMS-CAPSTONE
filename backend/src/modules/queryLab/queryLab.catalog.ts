export interface PredefinedQuery {
  id: string;
  category: 'Joins' | 'Subqueries' | 'Set Operations' | 'Business Analytics' | 'Advanced SQL' | 'Aggregates' | 'Filtering';
  name: string;
  sqlConcept: string;
  description: string;
  tablesInvolved: string[];
  businessUtility: string;
  sql: string;
  expectedSummary?: string;
}

export const PREDEFINED_QUERIES: PredefinedQuery[] = [
  // --- A. JOINS ---
  {
    id: 'join-inner',
    category: 'Joins',
    name: '1. INNER JOIN — Orders with Customer and Courier',
    sqlConcept: 'INNER JOIN across 3 related tables',
    description: 'Retrieves each order alongside the customer name and delivery courier. Only returns rows where matches exist across all three tables.',
    tablesInvolved: ['orders', 'customers', 'deliveries'],
    businessUtility: 'Gives logistics teams a consolidated view of who placed the order and who is delivering it.',
    sql: `SELECT o.order_id, c.first_name, o.total_amount, d.courier
FROM orders o
INNER JOIN customers c  ON c.customer_id = o.customer_id
INNER JOIN deliveries d ON d.order_id = o.order_id;`,
    expectedSummary: 'Returns 5 rows (orders 1 to 5) which have assigned deliveries.',
  },
  {
    id: 'join-left',
    category: 'Joins',
    name: '2. LEFT JOIN — Customers Who Never Ordered',
    sqlConcept: 'LEFT OUTER JOIN with IS NULL filter',
    description: 'Preserves all rows from the left table (customers) and checks for unmatched rows in orders where order_id IS NULL.',
    tablesInvolved: ['customers', 'orders'],
    businessUtility: 'Identifies registered leads who have never made a purchase for re-engagement marketing.',
    sql: `SELECT c.customer_id, c.first_name, c.email
FROM customers c 
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;`,
    expectedSummary: 'Returns Karan Gupta (customer_id 5) who registered but never ordered.',
  },
  {
    id: 'join-right',
    category: 'Joins',
    name: '3. RIGHT JOIN — Products That Were Never Ordered',
    sqlConcept: 'RIGHT OUTER JOIN with IS NULL filter',
    description: 'Preserves all products from the right table and identifies products that do not appear in any order_items.',
    tablesInvolved: ['order_items', 'products'],
    businessUtility: 'Identifies dead inventory or unmarketed items that tie up warehouse space without generating sales.',
    sql: `SELECT p.product_id, p.product_name, p.unit_price
FROM order_items oi 
RIGHT JOIN products p ON p.product_id = oi.product_id
WHERE oi.order_id IS NULL;`,
    expectedSummary: 'Returns Webcam (product_id 7).',
  },
  {
    id: 'join-full-outer',
    category: 'Joins',
    name: '4. FULL OUTER JOIN Emulation — Orders & Deliveries',
    sqlConcept: 'Emulated FULL JOIN using LEFT JOIN + RIGHT JOIN + UNION',
    description: 'MySQL does not have a native FULL OUTER JOIN keyword. This query emulates it by combining a LEFT JOIN and a RIGHT JOIN via UNION.',
    tablesInvolved: ['orders', 'deliveries'],
    businessUtility: 'Provides a complete audit of all orders and deliveries, surfacing orders without deliveries and unassigned deliveries.',
    sql: `SELECT o.order_id, o.status AS order_status, d.delivery_id, d.courier
FROM orders o 
LEFT JOIN deliveries d ON d.order_id = o.order_id
UNION
SELECT o.order_id, o.status AS order_status, d.delivery_id, d.courier
FROM orders o 
RIGHT JOIN deliveries d ON d.order_id = o.order_id;`,
    expectedSummary: 'Shows all 7 orders; orders 6 (CANCELLED) and 7 (PENDING) appear with NULL delivery details.',
  },
  {
    id: 'join-self',
    category: 'Joins',
    name: '5. SELF JOIN — Order Pairs Placed by Same Customer',
    sqlConcept: 'SELF JOIN with inequality condition (a.order_id < b.order_id)',
    description: 'Joins the orders table to itself on customer_id to find pairs of orders placed by the same customer, preventing duplicate reversed pairs.',
    tablesInvolved: ['orders'],
    businessUtility: 'Analyzes repeat buying behavior and intervals between multiple orders by the same customer.',
    sql: `SELECT a.customer_id, a.order_id AS first_order, b.order_id AS second_order
FROM orders a 
JOIN orders b ON a.customer_id = b.customer_id AND a.order_id < b.order_id;`,
    expectedSummary: 'Customer 1: pairs (1,2), (1,7), (2,7). Customer 3: pair (4,5).',
  },

  // --- B. SUBQUERIES ---
  {
    id: 'subquery-nested-scalar',
    category: 'Subqueries',
    name: '6. Nested Subquery — Products Costing Above Average',
    sqlConcept: 'Scalar subquery in WHERE clause',
    description: 'Computes the storewide average unit price in an inner subquery and filters products priced higher than that average in the outer query.',
    tablesInvolved: ['products'],
    businessUtility: 'Identifies high-tier premium catalogue items for targeted luxury or promotional positioning.',
    sql: `SELECT product_name, unit_price 
FROM products
WHERE unit_price > (SELECT AVG(unit_price) FROM products);`,
    expectedSummary: 'Returns Wireless Headphones (1200), Smartwatch (2500), and Webcam (1800), where average is ~979.86.',
  },
  {
    id: 'subquery-nested-in',
    category: 'Subqueries',
    name: '7. Nested Subquery with IN — Customers Buying Electronics',
    sqlConcept: 'Multi-row subquery with IN operator and joins inside subquery',
    description: 'Finds customers whose IDs are in the set of customer IDs who ordered items belonging to category 1 (Electronics).',
    tablesInvolved: ['customers', 'orders', 'order_items', 'products'],
    businessUtility: 'Enables category-specific marketing and cross-selling campaigns.',
    sql: `SELECT customer_id, first_name, email 
FROM customers 
WHERE customer_id IN (
  SELECT o.customer_id 
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p     ON p.product_id = oi.product_id
  WHERE p.category_id = 1
);`,
    expectedSummary: 'Returns Aarav, Priya, and Rohan.',
  },
  {
    id: 'subquery-correlated',
    category: 'Subqueries',
    name: '8. Correlated Subquery — Each Customer’s Biggest Order',
    sqlConcept: 'Correlated subquery evaluated per outer row',
    description: 'The inner subquery calculates MAX(total_amount) for the specific customer from the outer row, finding each customer’s maximum purchase.',
    tablesInvolved: ['orders'],
    businessUtility: 'Highlights peak transaction value per customer to identify spending capacity and high-net-worth clients.',
    sql: `SELECT o.customer_id, o.order_id, o.total_amount 
FROM orders o
WHERE o.total_amount = (
  SELECT MAX(o2.total_amount) 
  FROM orders o2
  WHERE o2.customer_id = o.customer_id
);`,
    expectedSummary: 'Customer 1: Order 1 (1800), Customer 2: Order 3 (1200), Customer 3: Order 5 (3700), Customer 4: Order 6 (198).',
  },
  {
    id: 'subquery-payment-check',
    category: 'Subqueries',
    name: '9. Payment Verification — Mismatched Orders vs Payments',
    sqlConcept: 'Correlated subquery in SELECT and WHERE with IFNULL',
    description: 'Compares the order’s total amount against the sum of successful payment records for that order, ignoring cancelled orders.',
    tablesInvolved: ['orders', 'payments'],
    businessUtility: 'Vital for financial reconciliation: immediately detects unpaid orders or payment discrepancies.',
    sql: `SELECT o.order_id, o.total_amount,
  (SELECT IFNULL(SUM(p.amount),0) FROM payments p
   WHERE p.order_id = o.order_id AND p.status = 'SUCCESS') AS paid
FROM orders o
WHERE o.status <> 'CANCELLED'
  AND o.total_amount <> (
    SELECT IFNULL(SUM(p.amount),0) FROM payments p
    WHERE p.order_id = o.order_id AND p.status = 'SUCCESS'
  );`,
    expectedSummary: 'Returns Order 7 (Pending, total ₹1200, paid ₹0).',
  },

  // --- C. SET OPERATIONS ---
  {
    id: 'set-union',
    category: 'Set Operations',
    name: '10. UNION — Placed Order OR Encountered Payment Issue',
    sqlConcept: 'UNION combining two SELECT queries with duplicate removal',
    description: 'Combines all customer IDs who placed an order with those who had a failed or refunded payment.',
    tablesInvolved: ['orders', 'payments'],
    businessUtility: 'Creates a unified cohort of engaged or distressed customers who interacted with checkout.',
    sql: `SELECT customer_id FROM orders
UNION
SELECT o.customer_id 
FROM orders o 
JOIN payments p ON p.order_id = o.order_id
WHERE p.status IN ('FAILED', 'REFUNDED');`,
    expectedSummary: 'Returns distinct customers 1, 2, 3, 4.',
  },
  {
    id: 'set-intersect',
    category: 'Set Operations',
    name: '11. INTERSECT — Customers Who Bought Both Product 1 & 3',
    sqlConcept: 'INTERSECT operator (MySQL 8.0.31+)',
    description: 'Finds customers present in both result sets: customers who bought Product 1 (Headphones) AND Product 3 (USB-C Cable).',
    tablesInvolved: ['orders', 'order_items'],
    businessUtility: 'Identifies high-propensity buyers for bundles (Headphones + Charging Cable bundle).',
    sql: `SELECT o.customer_id FROM orders o JOIN order_items i ON i.order_id = o.order_id WHERE i.product_id = 1
INTERSECT
SELECT o.customer_id FROM orders o JOIN order_items i ON i.order_id = o.order_id WHERE i.product_id = 3;`,
    expectedSummary: 'Returns customers 1 (Aarav) and 3 (Rohan).',
  },
  {
    id: 'set-except',
    category: 'Set Operations',
    name: '12. EXCEPT — Customers With No Successful Payment',
    sqlConcept: 'EXCEPT operator (MySQL 8.0.31+)',
    description: 'Subtracts all customers with a successful payment from the complete customers list, leaving those with zero successful revenue.',
    tablesInvolved: ['customers', 'orders', 'payments'],
    businessUtility: 'Pinpoints abandoned carts and uncollected revenue for payment recovery outreach.',
    sql: `SELECT customer_id FROM customers
EXCEPT
SELECT o.customer_id 
FROM orders o 
JOIN payments p ON p.order_id = o.order_id
WHERE p.status = 'SUCCESS';`,
    expectedSummary: 'Returns customer 4 (Neha - refunded only) and customer 5 (Karan - no order).',
  },

  // --- D. BUSINESS ANALYTICS ---
  {
    id: 'analytics-repeat-customers',
    category: 'Business Analytics',
    name: '13. Repeat Customers — Two or More Non-Cancelled Orders',
    sqlConcept: 'GROUP BY with HAVING COUNT(*) >= 2 and SUM aggregation',
    description: 'Identifies loyal customers who placed at least two valid orders, calculating total orders placed and total monetary spend.',
    tablesInvolved: ['customers', 'orders'],
    businessUtility: 'Core CRM metric for customer lifetime value (LTV) and loyalty reward programs.',
    sql: `SELECT c.customer_id, c.first_name,
       COUNT(*) AS total_orders, 
       SUM(o.total_amount) AS total_spent
FROM customers c 
JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status <> 'CANCELLED'
GROUP BY c.customer_id, c.first_name
HAVING COUNT(*) >= 2;`,
    expectedSummary: 'Aarav: 3 orders, ₹3720 spent. Rohan: 2 orders, ₹4450 spent.',
  },
  {
    id: 'analytics-best-sellers',
    category: 'Business Analytics',
    name: '14. Best-Selling Products — Top 5 by Units Sold',
    sqlConcept: 'GROUP BY, SUM product multiplication, ORDER BY DESC, LIMIT 5',
    description: 'Aggregates total quantities sold and cumulative revenue generated per product, sorting by units sold descending.',
    tablesInvolved: ['order_items', 'orders', 'products'],
    businessUtility: 'Informs procurement and stock replenishment for fast-moving consumer goods.',
    sql: `SELECT p.product_name, 
       SUM(oi.quantity) AS units_sold,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders o   ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
JOIN products p ON p.product_id = oi.product_id
GROUP BY p.product_name
ORDER BY units_sold DESC
LIMIT 5;`,
    expectedSummary: '1. USB-C Cable (7 units), 2. Headphones (3 units), 3. Notebook A5 (3 units).',
  },

  // --- E. ADVANCED SQL ---
  {
    id: 'advanced-window-ranking',
    category: 'Advanced SQL',
    name: '15. CTE + Window Functions — RANK, DENSE_RANK, ROW_NUMBER',
    sqlConcept: 'Common Table Expression (WITH) and multiple ranking window functions',
    description: 'Pre-aggregates product sales in a CTE, then calculates RANK() by revenue, DENSE_RANK() by units sold, and unique ROW_NUMBER().',
    tablesInvolved: ['order_items', 'orders', 'products'],
    businessUtility: 'Demonstrates handling ties in sales leaderboards and product performance benchmarking.',
    sql: `WITH product_sales AS (
  SELECT p.product_name,
         SUM(oi.quantity) AS units,
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM order_items oi
  JOIN orders o   ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
  JOIN products p ON p.product_id = oi.product_id
  GROUP BY p.product_name
)
SELECT product_name, units, revenue,
       RANK()       OVER (ORDER BY revenue DESC) AS revenue_rank,
       DENSE_RANK() OVER (ORDER BY units DESC)   AS units_rank,
       ROW_NUMBER() OVER (ORDER BY revenue DESC) AS row_no
FROM product_sales;`,
    expectedSummary: 'Wireless Headphones (1), Smartwatch (2), USB-C Cable (3), Keyboard (4), Notebook (5).',
  },
  {
    id: 'advanced-partition-by',
    category: 'Advanced SQL',
    name: '16. PARTITION BY — Top Product in Each Category',
    sqlConcept: 'Window function with PARTITION BY clause inside a CTE',
    description: 'Calculates sales revenue per product, partitions products by category, and filters for rank = 1 in each partition.',
    tablesInvolved: ['order_items', 'products', 'orders', 'categories'],
    businessUtility: 'Discovers category champions to feature on category landing pages.',
    sql: `WITH category_sales AS (
  SELECT p.category_id, p.product_name, 
         SUM(oi.quantity * oi.unit_price) AS revenue
  FROM order_items oi 
  JOIN products p ON p.product_id = oi.product_id
  JOIN orders o   ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
  GROUP BY p.category_id, p.product_name
)
SELECT * FROM (
  SELECT cs.*, 
         RANK() OVER (PARTITION BY category_id ORDER BY revenue DESC) AS rk 
  FROM category_sales cs
) t 
WHERE rk = 1;`,
    expectedSummary: 'Category 1 (Electronics): Wireless Headphones (₹3600). Category 2 (Stationery): Notebook A5 (₹450).',
  },
  {
    id: 'advanced-lag',
    category: 'Advanced SQL',
    name: '17. LAG Window Function — Order Intervals and History',
    sqlConcept: 'LAG() window function partitioned by customer',
    description: 'Sequences customer orders chronologically and inspects the preceding order date using LAG to track customer purchase frequency.',
    tablesInvolved: ['orders'],
    businessUtility: 'Analyzes churn risk and calculates time elapsed between repeat purchases.',
    sql: `SELECT customer_id, order_id, order_date,
       ROW_NUMBER()    OVER (PARTITION BY customer_id ORDER BY order_date) AS order_no,
       LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS previous_order
FROM orders 
WHERE status <> 'CANCELLED';`,
    expectedSummary: 'Shows sequence order_no (1, 2, 3...) and preceding order date for customers 1, 2, 3.',
  },

  // --- F. AGGREGATES ---
  {
    id: 'aggregate-summary',
    category: 'Aggregates',
    name: '18. Aggregate Metrics — COUNT, SUM, AVG, MIN, MAX',
    sqlConcept: 'Aggregate functions with GROUP BY and HAVING',
    description: 'Demonstrates all core SQL aggregate functions across product orders, including order counts, revenue, average price, and extremes.',
    tablesInvolved: ['order_items', 'products'],
    businessUtility: 'Provides executive financial summary statistics across the product catalog.',
    sql: `SELECT 
    COUNT(DISTINCT oi.order_id) AS total_orders_involved,
    COUNT(*) AS total_order_lines,
    SUM(oi.quantity) AS total_units_sold,
    AVG(oi.unit_price) AS avg_unit_price,
    MIN(oi.unit_price) AS min_unit_price,
    MAX(oi.unit_price) AS max_unit_price,
    SUM(oi.quantity * oi.unit_price) AS gross_sales
FROM order_items oi;`,
    expectedSummary: 'Aggregates all 10 order item lines into consolidated metrics.',
  },
  {
    id: 'aggregate-having',
    category: 'Aggregates',
    name: '19. GROUP BY and HAVING — High Volume Products',
    sqlConcept: 'GROUP BY with HAVING filter',
    description: 'Groups line items by product and filters groups where total units sold is strictly greater than 2.',
    tablesInvolved: ['order_items', 'products'],
    businessUtility: 'Filters for items that meet bulk volume sales thresholds.',
    sql: `SELECT p.product_name, SUM(oi.quantity) AS total_qty
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
GROUP BY p.product_name
HAVING SUM(oi.quantity) > 2
ORDER BY total_qty DESC;`,
    expectedSummary: 'Returns USB-C Cable (7), Wireless Headphones (3), and Notebook A5 (3).',
  },

  // --- G. FILTERING & CONDITIONS ---
  {
    id: 'filter-complex-conditions',
    category: 'Filtering',
    name: '20. Complex Filtering — BETWEEN, LIKE, IN, IS NOT NULL',
    sqlConcept: 'WHERE clauses with AND/OR, BETWEEN, LIKE, IN, and IS NOT NULL',
    description: 'Demonstrates composite filtering using price ranges (BETWEEN), string pattern matching (LIKE), set membership (IN), and nullability checks.',
    tablesInvolved: ['products', 'categories'],
    businessUtility: 'Powers advanced catalog searching and catalog filtering in retail storefronts.',
    sql: `SELECT p.product_id, p.product_name, p.sku, p.unit_price, c.category_name
FROM products p
JOIN categories c ON c.category_id = p.category_id
WHERE (p.unit_price BETWEEN 100 AND 2000)
  AND (p.product_name LIKE '%Wireless%' OR p.product_name LIKE '%Keyboard%' OR p.product_name LIKE '%Cable%')
  AND p.sku IS NOT NULL
ORDER BY p.unit_price DESC;`,
    expectedSummary: 'Returns Wireless Headphones, Mechanical Keyboard, and USB-C Cable.',
  },
];
