import { pool } from '../../config/database.js';

export class ViewsService {
  getViewsMetadata() {
    return [
      {
        name: 'vw_order_report',
        title: 'Order Report View',
        description:
          'Consolidated order report showing order ID, date, status, total amount, customer full name, and whether the order has not yet been shipped.',
        columns: [
          { name: 'order_id', type: 'INT', description: 'Unique order identifier' },
          { name: 'order_date', type: 'DATE', description: 'Date the order was placed' },
          { name: 'status', type: 'VARCHAR(10)', description: 'Order lifecycle status' },
          { name: 'total_amount', type: 'DECIMAL(12,2)', description: 'Final order total' },
          { name: 'customer', type: 'VARCHAR(101)', description: 'Full customer name (first + last)' },
          { name: 'not_shipped', type: 'INT (BOOLEAN)', description: '1 if delivery_id is NULL, 0 otherwise' },
        ],
        definition: `CREATE VIEW vw_order_report AS
SELECT o.order_id, o.order_date, o.status, o.total_amount,
       CONCAT(c.first_name,' ',c.last_name) AS customer, d.delivery_id IS NULL AS not_shipped
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
LEFT JOIN deliveries d ON d.order_id = o.order_id;`,
      },
      {
        name: 'vw_customer_type',
        title: 'Customer Segmentation View',
        description:
          'Categorizes customers into REPEAT (2+ non-cancelled orders), ONE-TIME (1 order), or NO ORDER (0 orders), showing total spend.',
        columns: [
          { name: 'customer_id', type: 'INT', description: 'Customer identifier' },
          { name: 'first_name', type: 'VARCHAR(50)', description: 'Customer first name' },
          { name: 'orders_placed', type: 'BIGINT', description: 'Count of non-cancelled orders placed' },
          { name: 'total_spent', type: 'DECIMAL(34,2)', description: 'Total revenue spent across orders' },
          { name: 'customer_type', type: 'VARCHAR(8)', description: 'Classification: REPEAT, ONE-TIME, or NO ORDER' },
        ],
        definition: `CREATE VIEW vw_customer_type AS
SELECT c.customer_id, c.first_name, COUNT(o.order_id) AS orders_placed,
       IFNULL(SUM(o.total_amount),0) AS total_spent,
       CASE WHEN COUNT(o.order_id) >= 2 THEN 'REPEAT'
            WHEN COUNT(o.order_id) = 1 THEN 'ONE-TIME'
            ELSE 'NO ORDER' END AS customer_type
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status <> 'CANCELLED'
GROUP BY c.customer_id, c.first_name;`,
      },
    ];
  }

  async executeView(viewName: string) {
    const validViews = ['vw_order_report', 'vw_customer_type'];
    if (!validViews.includes(viewName)) {
      throw new Error(`Invalid view name: "${viewName}". Available views: ${validViews.join(', ')}`);
    }

    const startTime = performance.now();
    const [rows, fields]: any = await pool.query(`SELECT * FROM \`${viewName}\``);
    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

    const columns = Array.isArray(fields)
      ? fields.map((f: any) => f.name)
      : rows.length > 0
      ? Object.keys(rows[0])
      : [];

    return {
      viewName,
      executionTimeMs,
      rowCount: rows.length,
      columns,
      rows,
    };
  }
}

export const viewsService = new ViewsService();
