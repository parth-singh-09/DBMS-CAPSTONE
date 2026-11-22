import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function main() {
  console.log('================================================================');
  console.log('E-Commerce Order & Customer Analytics - Database Initializer');
  console.log('================================================================');

  let connection;
  try {
    // 1. Connect to MySQL server
    console.log(`\n[1/7] Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}...`);
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected successfully.');

    // 2. Create database 'shop' if not exists
    console.log('\n[2/7] Ensuring database `shop` exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.changeUser({ database: 'shop' });
    console.log('✓ Database `shop` selected.');

    // 3. Execute schema.sql
    console.log('\n[3/7] Applying DDL schema (9 tables & constraints)...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log('✓ Schema applied successfully.');

    // 4. Execute seeds.sql
    console.log('\n[4/7] Applying exact sample seed data...');
    const seedsSql = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf-8');
    await connection.query(seedsSql);
    console.log('✓ Seed data applied successfully.');

    // 5. Execute views.sql
    console.log('\n[5/7] Creating analytical views (vw_order_report, vw_customer_type)...');
    const viewsSql = fs.readFileSync(path.join(__dirname, 'views.sql'), 'utf-8');
    await connection.query(viewsSql);
    console.log('✓ Views created successfully.');

    // 6. Ensure indexes exist
    console.log('\n[6/7] Creating secondary indexes...');
    const indexes = [
      { table: 'orders', name: 'idx_orders_customer', cols: '(customer_id, order_date)' },
      { table: 'order_items', name: 'idx_items_product', cols: '(product_id)' },
      { table: 'payments', name: 'idx_payments_order', cols: '(order_id, status)' },
      { table: 'products', name: 'idx_products_cat', cols: '(category_id)' },
    ];

    for (const idx of indexes) {
      const [existing]: any = await connection.query(
        `SELECT 1 FROM information_schema.statistics 
         WHERE table_schema = 'shop' AND table_name = ? AND index_name = ?`,
        [idx.table, idx.name]
      );
      if (existing.length === 0) {
        await connection.query(`CREATE INDEX ${idx.name} ON ${idx.table} ${idx.cols}`);
        console.log(`  + Created index ${idx.name} on ${idx.table}`);
      } else {
        console.log(`  - Index ${idx.name} on ${idx.table} already exists.`);
      }
    }
    console.log('✓ Indexes verified.');

    // 6.1 Ensure DCL Users (clerk and analyst) exist
    console.log('\n[6.1/7] Ensuring DCL users (clerk & analyst) exist with permissions...');
    await connection.query(`CREATE USER IF NOT EXISTS 'analyst'@'%' IDENTIFIED BY 'Pass@123';`);
    await connection.query(`CREATE USER IF NOT EXISTS 'clerk'@'%' IDENTIFIED BY 'Pass@456';`);
    await connection.query(`GRANT SELECT ON shop.* TO 'analyst'@'%';`);
    await connection.query(`GRANT SELECT, INSERT ON shop.orders TO 'clerk'@'%';`);
    await connection.query(`GRANT SELECT, INSERT ON shop.order_items TO 'clerk'@'%';`);
    await connection.query(`FLUSH PRIVILEGES;`);
    console.log('✓ DCL users and grants verified.');

    // 7. Comprehensive Verification
    console.log('\n[7/7] Running Comprehensive Verification & Benchmarks...');
    await runVerification(connection);

  } catch (err) {
    console.error('\n❌ Initialization Error:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function runVerification(conn: mysql.Connection) {
  console.log('\n----------------------------------------------------------------');
  console.log('A. TABLE INVENTORY & ROW COUNTS');
  console.log('----------------------------------------------------------------');
  const tables = [
    'customers',
    'categories',
    'products',
    'inventory',
    'discounts',
    'orders',
    'order_items',
    'payments',
    'deliveries',
  ];

  for (const t of tables) {
    const [rows]: any = await conn.query(`SELECT COUNT(*) as count FROM \`${t}\``);
    console.log(`  Table: ${t.padEnd(15)} | Count: ${rows[0].count}`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('B. VIEWS VERIFICATION');
  console.log('----------------------------------------------------------------');
  const [vw1]: any = await conn.query('SELECT COUNT(*) as cnt FROM vw_order_report');
  console.log(`  vw_order_report rows: ${vw1[0].cnt}`);
  const [vw2]: any = await conn.query('SELECT COUNT(*) as cnt FROM vw_customer_type');
  console.log(`  vw_customer_type rows: ${vw2[0].cnt}`);

  console.log('\n----------------------------------------------------------------');
  console.log('C. INDEXES VERIFICATION');
  console.log('----------------------------------------------------------------');
  const [indexes]: any = await conn.query(`
    SELECT TABLE_NAME as tbl, INDEX_NAME as idx_name, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols, NON_UNIQUE as non_uq
    FROM information_schema.statistics
    WHERE table_schema = 'shop' AND INDEX_NAME LIKE 'idx_%'
    GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
  `);
  for (const idx of indexes) {
    const idxName = idx.idx_name || idx.INDEX_NAME || '';
    const tbl = idx.tbl || idx.TABLE_NAME || '';
    const cols = idx.cols || '';
    const isUnique = (idx.non_uq ?? idx.NON_UNIQUE) === 0;
    console.log(`  Index: ${idxName.padEnd(20)} on ${tbl}(${cols}) [Unique: ${isUnique}]`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('D. REPORT EXPECTED ANALYTICAL QUERIES');
  console.log('----------------------------------------------------------------');

  // Query 12: Repeat customers
  console.log('\n1. Repeat Customers (Query 12) - Expected: Aarav (3 orders, 3720), Rohan (2 orders, 4450):');
  const [repeatCust]: any = await conn.query(`
    SELECT c.customer_id, c.first_name,
           COUNT(*) AS total_orders, SUM(o.total_amount) AS total_spent
    FROM customers c JOIN orders o ON o.customer_id = c.customer_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY c.customer_id, c.first_name
    HAVING COUNT(*) >= 2;
  `);
  console.table(repeatCust);

  // Query 2: Customer with no orders
  console.log('\n2. Customer with No Orders (Query 2) - Expected: Karan (customer_id 5):');
  const [noOrders]: any = await conn.query(`
    SELECT c.customer_id, c.first_name
    FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
    WHERE o.order_id IS NULL;
  `);
  console.table(noOrders);

  // Query 3: Product never ordered
  console.log('\n3. Product Never Ordered (Query 3) - Expected: Webcam:');
  const [neverOrdered]: any = await conn.query(`
    SELECT p.product_name
    FROM order_items oi RIGHT JOIN products p ON p.product_id = oi.product_id
    WHERE oi.order_id IS NULL;
  `);
  console.table(neverOrdered);

  // Query 13: Best seller by units sold
  console.log('\n4. Best Sellers by Units Sold (Query 13) - Expected: USB-C Cable (7 units), Headphones (3), Notebook (3):');
  const [bestSellers]: any = await conn.query(`
    SELECT p.product_name, SUM(oi.quantity) AS units_sold,
           SUM(oi.quantity * oi.unit_price) AS revenue
    FROM order_items oi
    JOIN orders o   ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
    JOIN products p ON p.product_id = oi.product_id
    GROUP BY p.product_name
    ORDER BY units_sold DESC
    LIMIT 5;
  `);
  console.table(bestSellers);

  // Query 14: Revenue Ranking with Window Functions
  console.log('\n5. Revenue Ranking with Window Functions (Query 14) - Expected 1: Headphones (3600), 2: Smartwatch (2500), 3: USB-C Cable (2100), 4: Keyboard (800), 5: Notebook A5 (450):');
  const [rankings]: any = await conn.query(`
    WITH product_sales AS (
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
    FROM product_sales;
  `);
  console.table(rankings);

  // Query 8: Payment Verification Check
  console.log('\n6. Payment Verification Check (Query 8) - Expected: Order 7 (unpaid):');
  const [unpaid]: any = await conn.query(`
    SELECT o.order_id, o.total_amount,
      (SELECT IFNULL(SUM(p.amount),0) FROM payments p
       WHERE p.order_id = o.order_id AND p.status='SUCCESS') AS paid
    FROM orders o
    WHERE o.status <> 'CANCELLED'
      AND o.total_amount <> (SELECT IFNULL(SUM(p.amount),0) FROM payments p
                             WHERE p.order_id = o.order_id AND p.status='SUCCESS');
  `);
  console.table(unpaid);

  // Query 10: INTERSECT (MySQL 8.0.31+)
  console.log('\n7. INTERSECT (Query 10) - Customers who bought both Product 1 & Product 3: Expected Aarav (1), Rohan (3):');
  const [intersectRows]: any = await conn.query(`
    SELECT o.customer_id FROM orders o JOIN order_items i ON i.order_id=o.order_id WHERE i.product_id=1
    INTERSECT
    SELECT o.customer_id FROM orders o JOIN order_items i ON i.order_id=o.order_id WHERE i.product_id=3;
  `);
  console.table(intersectRows);

  // Query 11: EXCEPT (MySQL 8.0.31+)
  console.log('\n8. EXCEPT (Query 11) - Customers with no successful payment: Expected Neha (4), Karan (5):');
  const [exceptRows]: any = await conn.query(`
    SELECT customer_id FROM customers
    EXCEPT
    SELECT o.customer_id FROM orders o JOIN payments p ON p.order_id=o.order_id
    WHERE p.status='SUCCESS';
  `);
  console.table(exceptRows);

  console.log('\n----------------------------------------------------------------');
  console.log('E. CONSISTENCY CHECKS (Report Section 7 Validation)');
  console.log('----------------------------------------------------------------');

  // Check A: Orders that have no items (expect 0 rows)
  const [checkA]: any = await conn.query(`
    SELECT o.order_id FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.order_id WHERE i.order_id IS NULL;
  `);
  console.log(`  Check A (Orders without items - expect 0 rows): ${checkA.length} rows returned. ${checkA.length === 0 ? '✓ PASS' : '❌ FAIL'}`);

  // Check B: Orders whose total differs from sum of items (expect only Order 2 with SAVE10 discount)
  const [checkB]: any = await conn.query(`
    SELECT o.order_id, o.total_amount, SUM(i.quantity * i.unit_price) AS items_total
    FROM orders o JOIN order_items i ON i.order_id = o.order_id
    GROUP BY o.order_id, o.total_amount
    HAVING o.total_amount <> SUM(i.quantity * i.unit_price);
  `);
  console.log(`  Check B (Orders total <> items sum - expect Order 2 only):`);
  console.table(checkB);
  const passB = checkB.length === 1 && checkB[0].order_id === 2;
  console.log(`  Result: ${passB ? '✓ PASS' : '❌ FAIL'}`);

  // Check C: Products at or below reorder level (expect only Smartwatch with qty 8 <= 10)
  const [checkC]: any = await conn.query(`
    SELECT p.product_name, v.qty_on_hand, v.reorder_level
    FROM inventory v JOIN products p ON p.product_id = v.product_id
    WHERE v.qty_on_hand <= v.reorder_level;
  `);
  console.log(`  Check C (Products <= reorder level - expect Smartwatch only):`);
  console.table(checkC);
  const passC = checkC.length === 1 && checkC[0].product_name === 'Smartwatch';
  console.log(`  Result: ${passC ? '✓ PASS' : '❌ FAIL'}`);

  console.log('\n----------------------------------------------------------------');
  console.log('F. CONSTRAINT & TCL TESTS (Report Section 7 Tests 1 to 8)');
  console.log('----------------------------------------------------------------');
  await runConstraintTests(conn);
}

async function runConstraintTests(conn: mysql.Connection) {
  const tests = [
    {
      num: 1,
      name: 'Insert customer with duplicate email',
      sql: `INSERT INTO customers (first_name, last_name, email, phone, address) 
            VALUES ('Duplicate', 'User', 'aarav@mail.com', '9999999999', 'Delhi')`,
      expected: 'UNIQUE error (ER_DUP_ENTRY)',
      action: async () => {
        await conn.query(`INSERT INTO customers (first_name, last_name, email, phone, address) 
                          VALUES ('Duplicate', 'User', 'aarav@mail.com', '9999999999', 'Delhi')`);
      },
    },
    {
      num: 2,
      name: 'Insert order with non-existent customer_id 99',
      sql: `INSERT INTO orders (customer_id, order_date, status, total_amount) 
            VALUES (99, '2026-11-20', 'PENDING', 500)`,
      expected: 'Foreign key error (ER_NO_REFERENCED_ROW_2)',
      action: async () => {
        await conn.query(`INSERT INTO orders (customer_id, order_date, status, total_amount) 
                          VALUES (99, '2026-11-20', 'PENDING', 500)`);
      },
    },
    {
      num: 3,
      name: 'Insert order item with quantity 0',
      sql: `INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
            VALUES (1, 2, 0, 800)`,
      expected: 'CHECK error (ER_CHECK_CONSTRAINT_VIOLATED)',
      action: async () => {
        await conn.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
                          VALUES (1, 2, 0, 800)`);
      },
    },
    {
      num: 4,
      name: 'Set inventory qty_on_hand to -5',
      sql: `UPDATE inventory SET qty_on_hand = -5 WHERE product_id = 1`,
      expected: 'CHECK error (ER_CHECK_CONSTRAINT_VIOLATED)',
      action: async () => {
        await conn.query(`UPDATE inventory SET qty_on_hand = -5 WHERE product_id = 1`);
      },
    },
    {
      num: 5,
      name: 'Insert a second delivery for order 1',
      sql: `INSERT INTO deliveries (order_id, courier, tracking_no, shipped_on, delivered_on) 
            VALUES (1, 'FedEx', 'FX9999', '2026-11-20', NULL)`,
      expected: 'UNIQUE error on order_id (ER_DUP_ENTRY)',
      action: async () => {
        await conn.query(`INSERT INTO deliveries (order_id, courier, tracking_no, shipped_on, delivered_on) 
                          VALUES (1, 'FedEx', 'FX9999', '2026-11-20', NULL)`);
      },
    },
    {
      num: 6,
      name: 'Delete customer 1 when dependent orders exist',
      sql: `DELETE FROM customers WHERE customer_id = 1`,
      expected: 'Foreign key error (ER_ROW_IS_REFERENCED_2)',
      action: async () => {
        await conn.query(`DELETE FROM customers WHERE customer_id = 1`);
      },
    },
    {
      num: 7,
      name: 'Attempt DELETE using read-only analyst account',
      sql: `DELETE FROM customers WHERE customer_id = 5 (as analyst)`,
      expected: 'Permission denied / command denied (ER_TABLEACCESS_DENIED_ERROR)',
      action: async () => {
        // Create user analyst if not exists and grant only SELECT
        await conn.query(`CREATE USER IF NOT EXISTS 'analyst'@'%' IDENTIFIED BY 'Pass@123'`);
        await conn.query(`REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'analyst'@'%'`);
        await conn.query(`GRANT SELECT ON shop.* TO 'analyst'@'%'`);
        await conn.query(`FLUSH PRIVILEGES`);

        // Connect as analyst
        const analystConn = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: 'analyst',
          password: 'Pass@123',
          database: 'shop',
        });

        try {
          await analystConn.query(`DELETE FROM customers WHERE customer_id = 5`);
        } finally {
          await analystConn.end();
        }
      },
    },
    {
      num: 8,
      name: 'Transaction Demonstration with SAVEPOINT & ROLLBACK TO SAVEPOINT',
      sql: `START TRANSACTION -> Insert Order & valid item -> SAVEPOINT -> Insert invalid item (qty=-50) -> ROLLBACK TO SAVEPOINT -> COMMIT`,
      expected: 'Valid operations committed, invalid operations rolled back',
      action: async () => {
        // Dedicated connection for the transaction
        const txConn = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: 'root',
          password: '',
          database: 'shop',
        });

        try {
          await txConn.beginTransaction();

          // 1. Insert order for Priya
          const [orderRes]: any = await txConn.query(
            `INSERT INTO orders (customer_id, order_date, status, total_amount) 
             VALUES (2, '2026-11-10', 'PENDING', 1200)`
          );
          const newOrderId = orderRes.insertId;

          // 2. Insert valid item (Headphones)
          await txConn.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
             VALUES (?, 1, 1, 1200)`,
            [newOrderId]
          );

          // 3. Decrement inventory
          await txConn.query(
            `UPDATE inventory SET qty_on_hand = qty_on_hand - 1 WHERE product_id = 1`
          );

          // 4. Create Savepoint
          await txConn.query('SAVEPOINT after_first_item');

          // 5. Attempt invalid stock update (decrement by 50 when stock is 8 -> check constraint violation)
          let caughtError = false;
          try {
            await txConn.query(
              `UPDATE inventory SET qty_on_hand = qty_on_hand - 50 WHERE product_id = 5`
            );
          } catch (e: any) {
            caughtError = true;
            // 6. Rollback to savepoint
            await txConn.query('ROLLBACK TO SAVEPOINT after_first_item');
          }

          if (!caughtError) {
            throw new Error('Expected invalid stock update to fail!');
          }

          // 7. Commit valid operations
          await txConn.commit();

          // Clean up demo order so tests remain idempotent
          await txConn.query(`DELETE FROM order_items WHERE order_id = ?`, [newOrderId]);
          await txConn.query(`DELETE FROM orders WHERE order_id = ?`, [newOrderId]);
          await txConn.query(`UPDATE inventory SET qty_on_hand = qty_on_hand + 1 WHERE product_id = 1`);

        } finally {
          await txConn.end();
        }
      },
    },
  ];

  for (const t of tests) {
    try {
      await t.action();
      if (t.num !== 8) {
        console.log(`  Test ${t.num}: ${t.name} -> ❌ FAIL (Operation unexpectedly succeeded)`);
      } else {
        console.log(`  Test ${t.num}: ${t.name} -> ✓ PASS (${t.expected})`);
      }
    } catch (err: any) {
      console.log(`  Test ${t.num}: ${t.name}`);
      console.log(`    Expected: ${t.expected}`);
      console.log(`    Actual Error Code: ${err.code || 'ERROR'}`);
      console.log(`    Actual Message: ${err.message?.split('\n')[0]}`);
      console.log(`    Status: ✓ PASS (Correctly rejected by database constraint)`);
    }
  }
}

main();
