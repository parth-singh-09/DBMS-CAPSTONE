import { pool } from '../../config/database.js';

export class SchemaService {
  async getSchemaMetadata() {
    // 1. Get tables
    const [tables]: any = await pool.query(`
      SELECT TABLE_NAME as tableName, TABLE_COMMENT as comment
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'shop' AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME ASC;
    `);

    // 2. Get columns
    const [columns]: any = await pool.query(`
      SELECT 
        TABLE_NAME as tableName,
        COLUMN_NAME as columnName,
        DATA_TYPE as dataType,
        COLUMN_TYPE as columnType,
        IS_NULLABLE as isNullable,
        COLUMN_KEY as columnKey,
        COLUMN_DEFAULT as columnDefault,
        EXTRA as extra
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'shop'
      ORDER BY TABLE_NAME, ORDINAL_POSITION;
    `);

    // 3. Get foreign keys
    const [foreignKeys]: any = await pool.query(`
      SELECT 
        k.TABLE_NAME as fromTable,
        k.COLUMN_NAME as fromColumn,
        k.REFERENCED_TABLE_NAME as toTable,
        k.REFERENCED_COLUMN_NAME as toColumn,
        k.CONSTRAINT_NAME as constraintName
      FROM information_schema.KEY_COLUMN_USAGE k
      WHERE k.TABLE_SCHEMA = 'shop' 
        AND k.REFERENCED_TABLE_NAME IS NOT NULL;
    `);

    // 4. Get constraints
    const [constraints]: any = await pool.query(`
      SELECT 
        TABLE_NAME as tableName,
        CONSTRAINT_NAME as constraintName,
        CONSTRAINT_TYPE as constraintType
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'shop'
      ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
    `);

    // Build relationship graph with cardinalities from report
    // Customer -> Orders (1:N)
    // Orders <-> Products (M:N via order_items)
    // Category -> Products (1:N)
    // Product -> Inventory (1:1)
    // Discount -> Orders (1:N)
    // Orders -> Payments (1:N)
    // Orders -> Deliveries (1:1)
    const relationships = [
      {
        id: 'rel_cust_orders',
        from: 'customers',
        fromCol: 'customer_id',
        to: 'orders',
        toCol: 'customer_id',
        cardinality: '1:N',
        label: 'places (1:N)',
      },
      {
        id: 'rel_cat_products',
        from: 'categories',
        fromCol: 'category_id',
        to: 'products',
        toCol: 'category_id',
        cardinality: '1:N',
        label: 'belongs to (1:N)',
      },
      {
        id: 'rel_prod_inventory',
        from: 'products',
        fromCol: 'product_id',
        to: 'inventory',
        toCol: 'product_id',
        cardinality: '1:1',
        label: 'has stock (1:1)',
      },
      {
        id: 'rel_disc_orders',
        from: 'discounts',
        fromCol: 'discount_id',
        to: 'orders',
        toCol: 'discount_id',
        cardinality: '1:N',
        label: 'applies to (1:N)',
      },
      {
        id: 'rel_orders_items',
        from: 'orders',
        fromCol: 'order_id',
        to: 'order_items',
        toCol: 'order_id',
        cardinality: '1:N',
        label: 'contains (1:N)',
      },
      {
        id: 'rel_prod_items',
        from: 'products',
        fromCol: 'product_id',
        to: 'order_items',
        toCol: 'product_id',
        cardinality: '1:N',
        label: 'ordered in (1:N)',
      },
      {
        id: 'rel_orders_payments',
        from: 'orders',
        fromCol: 'order_id',
        to: 'payments',
        toCol: 'order_id',
        cardinality: '1:N',
        label: 'paid by (1:N)',
      },
      {
        id: 'rel_orders_deliveries',
        from: 'orders',
        fromCol: 'order_id',
        to: 'deliveries',
        toCol: 'order_id',
        cardinality: '1:1',
        label: 'delivered by (1:1)',
      },
    ];

    // Group columns by table
    const tablesMap: Record<string, any> = {};
    for (const t of tables) {
      tablesMap[t.tableName] = {
        name: t.tableName,
        columns: [],
        constraints: [],
        foreignKeys: [],
      };
    }

    for (const c of columns) {
      if (tablesMap[c.tableName]) {
        tablesMap[c.tableName].columns.push({
          name: c.columnName,
          type: c.columnType,
          isPrimary: c.columnKey === 'PRI',
          isUnique: c.columnKey === 'UNI',
          isNullable: c.isNullable === 'YES',
          default: c.columnDefault,
        });
      }
    }

    for (const con of constraints) {
      if (tablesMap[con.tableName]) {
        tablesMap[con.tableName].constraints.push({
          name: con.constraintName,
          type: con.constraintType,
        });
      }
    }

    for (const fk of foreignKeys) {
      if (tablesMap[fk.fromTable]) {
        tablesMap[fk.fromTable].foreignKeys.push({
          column: fk.fromColumn,
          refTable: fk.toTable,
          refColumn: fk.toColumn,
          constraintName: fk.constraintName,
        });
      }
    }

    return {
      database: 'shop',
      tables: Object.values(tablesMap),
      relationships,
    };
  }
}

export const schemaService = new SchemaService();
