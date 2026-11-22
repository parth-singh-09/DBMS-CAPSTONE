import { pool, readOnlyPool } from '../../config/database.js';

export class IndexesService {
  async getAllIndexes() {
    const [rows]: any = await pool.query(`
      SELECT 
        TABLE_NAME as table_name,
        INDEX_NAME as index_name,
        NON_UNIQUE as non_unique,
        INDEX_TYPE as index_type,
        GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') AS columns,
        (NON_UNIQUE = 0) as is_unique,
        (INDEX_NAME = 'PRIMARY') as is_primary
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = 'shop'
      GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE, INDEX_TYPE
      ORDER BY is_primary DESC, TABLE_NAME ASC, INDEX_NAME ASC;
    `);

    // Educational context for the report's 4 custom secondary indexes
    const reportIndexMeta: Record<string, { purpose: string; benefit: string; impact: string }> = {
      idx_orders_customer: {
        purpose: 'Composite index on orders(customer_id, order_date)',
        benefit: 'Accelerates customer order lookups, customer history sorting, and JOINs with customers table.',
        impact: 'Saves full table scans on orders when filtering by customer_id or ordering by order_date.',
      },
      idx_items_product: {
        purpose: 'Index on order_items(product_id)',
        benefit: 'Optimizes sales aggregations, product order lookups, and JOINs between order_items and products.',
        impact: 'Allows instant index seek when looking up which orders contain a given product ID.',
      },
      idx_payments_order: {
        purpose: 'Composite index on payments(order_id, status)',
        benefit: 'Speed up payment reconciliation checks (e.g. finding SUCCESS payments for a specific order).',
        impact: 'Crucial for financial audits and query 8 payment verification.',
      },
      idx_products_cat: {
        purpose: 'Index on products(category_id)',
        benefit: 'Enables quick category browsing, category partitions, and filtering by category.',
        impact: 'Speeds up category sales reports and window function partitions.',
      },
    };

    const enriched = rows.map((r: any) => ({
      ...r,
      metadata: reportIndexMeta[r.index_name] || null,
    }));

    return enriched;
  }

  async explainQuery(sql: string) {
    const trimmed = sql.trim();
    if (!trimmed.toUpperCase().startsWith('SELECT') && !trimmed.toUpperCase().startsWith('WITH')) {
      throw new Error('EXPLAIN can only be run on SELECT or WITH statements.');
    }

    const explainSql = `EXPLAIN ${trimmed}`;
    const startTime = performance.now();
    const [rows, fields]: any = await readOnlyPool.query(explainSql);
    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

    const columns = Array.isArray(fields)
      ? fields.map((f: any) => f.name)
      : rows.length > 0
      ? Object.keys(rows[0])
      : [];

    return {
      sql: trimmed,
      explainSql,
      columns,
      rows,
      plan: rows,
      executionTimeMs,
    };
  }
}

export const indexesService = new IndexesService();
