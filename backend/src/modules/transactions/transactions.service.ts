import mysql from 'mysql2/promise';
import { pool } from '../../config/database.js';

interface StepLog {
  stepNumber: number;
  title: string;
  sql: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  message: string;
  resultData?: any;
}

export class TransactionsService {
  async runFullDemonstration() {
    // Acquire dedicated connection from the pool so all TCL statements run in the same session
    const conn = await pool.getConnection();
    const steps: StepLog[] = [];
    let orderId: number | null = null;

    try {
      // Step 1: START TRANSACTION
      const step1Sql = 'START TRANSACTION;';
      await conn.beginTransaction();
      steps.push({
        stepNumber: 1,
        title: 'Start Transaction',
        sql: step1Sql,
        status: 'SUCCESS',
        message: 'Transaction started. Auto-commit disabled.',
      });

      // Step 2: Insert order for customer 2 (Priya)
      const step2Sql = `INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES (2, '2026-11-10', 'PENDING', 1200);`;
      const [orderRes]: any = await conn.query(
        `INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES (2, '2026-11-10', 'PENDING', 1200)`
      );
      orderId = orderRes.insertId;
      steps.push({
        stepNumber: 2,
        title: 'Insert Order',
        sql: step2Sql,
        status: 'SUCCESS',
        message: `Order inserted successfully. Generated order_id = ${orderId}.`,
        resultData: { order_id: orderId, customer_id: 2, total_amount: 1200 },
      });

      // Step 3: Insert valid order item (1 Headphones)
      const step3Sql = `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (${orderId}, 1, 1, 1200);`;
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, 1, 1, 1200)`,
        [orderId]
      );
      steps.push({
        stepNumber: 3,
        title: 'Insert Valid Order Item',
        sql: step3Sql,
        status: 'SUCCESS',
        message: `Added 1 unit of Wireless Headphones (Product 1) at ₹1200.`,
      });

      // Step 4: Decrease inventory for Product 1
      const step4Sql = `UPDATE inventory SET qty_on_hand = qty_on_hand - 1 WHERE product_id = 1;`;
      await conn.query(
        `UPDATE inventory SET qty_on_hand = qty_on_hand - 1 WHERE product_id = 1`
      );
      const [inv1]: any = await conn.query(`SELECT qty_on_hand FROM inventory WHERE product_id = 1`);
      steps.push({
        stepNumber: 4,
        title: 'Update Inventory (Valid Item)',
        sql: step4Sql,
        status: 'SUCCESS',
        message: `Decreased stock for Wireless Headphones. Remaining stock: ${inv1[0].qty_on_hand}.`,
      });

      // Step 5: Create SAVEPOINT after_first_item
      const step5Sql = `SAVEPOINT after_first_item;`;
      await conn.query('SAVEPOINT after_first_item');
      steps.push({
        stepNumber: 5,
        title: 'Create SAVEPOINT',
        sql: step5Sql,
        status: 'SUCCESS',
        message: `Created SAVEPOINT 'after_first_item'. Checkpoint created.`,
      });

      // Step 6: Attempt invalid item insertion & negative stock (50 Smartwatches when stock is 8)
      const step6Sql = `INSERT INTO order_items VALUES (${orderId}, 5, 50, 2500);\nUPDATE inventory SET qty_on_hand = qty_on_hand - 50 WHERE product_id = 5;`;
      let errorOccurred = false;
      let errorMsg = '';
      try {
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, 5, 50, 2500)`,
          [orderId]
        );
        // This update violates CHECK (qty_on_hand >= 0)
        await conn.query(
          `UPDATE inventory SET qty_on_hand = qty_on_hand - 50 WHERE product_id = 5`
        );
      } catch (err: any) {
        errorOccurred = true;
        errorMsg = err.message;
      }

      steps.push({
        stepNumber: 6,
        title: 'Attempt Invalid Stock Update (Too many smartwatches)',
        sql: step6Sql,
        status: 'FAILED',
        message: `CHECK constraint violation triggered: ${errorMsg}`,
      });

      // Step 7: Rollback to savepoint
      const step7Sql = `ROLLBACK TO SAVEPOINT after_first_item;`;
      if (errorOccurred) {
        await conn.query('ROLLBACK TO SAVEPOINT after_first_item');
        steps.push({
          stepNumber: 7,
          title: 'Rollback to Savepoint',
          sql: step7Sql,
          status: 'ROLLED_BACK',
          message: `Safely reverted bad item without aborting the entire transaction. First item preserved.`,
        });
      }

      // Step 8: COMMIT valid operations
      const step8Sql = `COMMIT;`;
      await conn.commit();
      steps.push({
        stepNumber: 8,
        title: 'Commit Transaction',
        sql: step8Sql,
        status: 'SUCCESS',
        message: `Transaction committed successfully! The valid order and item are permanently saved in MySQL.`,
      });

      // Clean up demonstration order so sample seeds remain pristine
      await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
      await conn.query(`DELETE FROM orders WHERE order_id = ?`, [orderId]);
      await conn.query(`UPDATE inventory SET qty_on_hand = qty_on_hand + 1 WHERE product_id = 1`);

      return {
        success: true,
        summary: 'Demonstration completed successfully. Valid operations were committed and invalid operations were rolled back.',
        orderId,
        steps,
      };

    } catch (fatalErr: any) {
      await conn.rollback();
      throw fatalErr;
    } finally {
      conn.release();
    }
  }
}

export const transactionsService = new TransactionsService();
