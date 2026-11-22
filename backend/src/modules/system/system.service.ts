import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection } from '../../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SystemService {
  async getStatus() {
    const connTest = await testConnection();
    return {
      serverTime: new Date().toISOString(),
      database: {
        name: process.env.DB_NAME || 'shop',
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        ...connTest,
      },
    };
  }

  async resetToSeeds() {
    const conn = await pool.getConnection();
    try {
      const databaseDir = path.resolve(__dirname, '../../../database');
      const schemaSql = fs.readFileSync(path.join(databaseDir, 'schema.sql'), 'utf-8');
      const seedsSql = fs.readFileSync(path.join(databaseDir, 'seeds.sql'), 'utf-8');
      const viewsSql = fs.readFileSync(path.join(databaseDir, 'views.sql'), 'utf-8');

      // Clean previous records to prevent orphaned test data
      try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
        await conn.query('DELETE FROM deliveries;');
        await conn.query('DELETE FROM payments;');
        await conn.query('DELETE FROM order_items;');
        await conn.query('DELETE FROM orders;');
        await conn.query('DELETE FROM discounts;');
        await conn.query('DELETE FROM inventory;');
        await conn.query('DELETE FROM products;');
        await conn.query('DELETE FROM categories;');
        await conn.query('DELETE FROM customers;');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
      } catch {
        // Continue if tables don't exist yet
      }

      // 1. Re-apply schema
      await conn.query(schemaSql);
      // 2. Re-apply seeds
      await conn.query(seedsSql);
      // 3. Re-apply views
      await conn.query(viewsSql);

      // Verify counts
      const [custRows]: any = await conn.query('SELECT COUNT(*) as count FROM customers');
      const [orderRows]: any = await conn.query('SELECT COUNT(*) as count FROM orders');

      return {
        success: true,
        message: 'Database successfully reset to official project report sample data.',
        counts: {
          customers: custRows[0].count,
          orders: orderRows[0].count,
        },
      };
    } finally {
      conn.release();
    }
  }
}

export const systemService = new SystemService();
