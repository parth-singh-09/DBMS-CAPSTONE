import { pool } from '../../config/database.js';

export class AnalyticsService {
  async getDashboardSummary() {
    // 1. KPI Stats
    const [custRows]: any = await pool.query('SELECT COUNT(*) as total FROM customers');
    const [prodRows]: any = await pool.query('SELECT COUNT(*) as total FROM products');
    const [catRows]: any = await pool.query('SELECT COUNT(*) as total FROM categories');
    const [orderRows]: any = await pool.query('SELECT COUNT(*) as total FROM orders');
    
    // Revenue from non-cancelled orders
    const [revRows]: any = await pool.query(
      `SELECT IFNULL(SUM(total_amount), 0) as total_revenue 
       FROM orders WHERE status <> 'CANCELLED'`
    );

    // Successful payments total
    const [paidRows]: any = await pool.query(
      `SELECT IFNULL(SUM(amount), 0) as total_paid, COUNT(*) as count 
       FROM payments WHERE status = 'SUCCESS'`
    );

    // Orders by status count
    const [statusCounts]: any = await pool.query(
      `SELECT 
         SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
         SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_count,
         SUM(CASE WHEN status = 'SHIPPED' THEN 1 ELSE 0 END) as shipped_count,
         SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count
       FROM orders`
    );

    // Low stock count (qty_on_hand <= reorder_level)
    const [lowStockRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM inventory WHERE qty_on_hand <= reorder_level`
    );

    // Repeat customers count (>= 2 non-cancelled orders)
    const [repeatRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (
         SELECT customer_id FROM orders 
         WHERE status <> 'CANCELLED' 
         GROUP BY customer_id 
         HAVING COUNT(*) >= 2
       ) as r`
    );

    return {
      kpi: {
        totalCustomers: Number(custRows[0].total),
        totalProducts: Number(prodRows[0].total),
        totalCategories: Number(catRows[0].total),
        totalOrders: Number(orderRows[0].total),
        totalRevenue: Number(revRows[0].total_revenue),
        totalSuccessfulPayments: Number(paidRows[0].total_paid),
        successfulPaymentsCount: Number(paidRows[0].count),
        pendingOrders: Number(statusCounts[0].pending_count || 0),
        shippedOrders: Number(statusCounts[0].shipped_count || 0),
        deliveredOrders: Number(statusCounts[0].delivered_count || 0),
        cancelledOrders: Number(statusCounts[0].cancelled_count || 0),
        lowStockProducts: Number(lowStockRows[0].total),
        repeatCustomers: Number(repeatRows[0].total),
      },
    };
  }

  async getRevenueOverTime() {
    const [rows]: any = await pool.query(`
      SELECT order_date, 
             COUNT(*) as order_count,
             SUM(total_amount) as daily_revenue
      FROM orders
      WHERE status <> 'CANCELLED'
      GROUP BY order_date
      ORDER BY order_date ASC
    `);
    return rows;
  }

  async getOrdersByStatus() {
    const [rows]: any = await pool.query(`
      SELECT status, 
             COUNT(*) as count, 
             IFNULL(SUM(total_amount), 0) as total_amount
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
    return rows;
  }

  async getBestSellingProducts(limit = 5) {
    const [rows]: any = await pool.query(`
      SELECT p.product_id, p.product_name, c.category_name,
             SUM(oi.quantity) AS units_sold,
             SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
      JOIN products p ON p.product_id = oi.product_id
      JOIN categories c ON c.category_id = p.category_id
      GROUP BY p.product_id, p.product_name, c.category_name
      ORDER BY units_sold DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  async getRevenueByCategory() {
    const [rows]: any = await pool.query(`
      SELECT c.category_id, c.category_name,
             COUNT(DISTINCT oi.order_id) as orders_count,
             SUM(oi.quantity) as units_sold,
             IFNULL(SUM(oi.quantity * oi.unit_price), 0) as total_revenue
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.category_id
      LEFT JOIN order_items oi ON oi.product_id = p.product_id
      LEFT JOIN orders o ON o.order_id = oi.order_id AND o.status <> 'CANCELLED'
      GROUP BY c.category_id, c.category_name
      ORDER BY total_revenue DESC
    `);
    return rows;
  }

  async getPaymentMethodsDistribution() {
    const [rows]: any = await pool.query(`
      SELECT method,
             status,
             COUNT(*) as transaction_count,
             IFNULL(SUM(amount), 0) as total_amount
      FROM payments
      GROUP BY method, status
      ORDER BY total_amount DESC
    `);
    return rows;
  }

  async getCustomerSegmentation() {
    const [rows]: any = await pool.query(`
      SELECT customer_type, COUNT(*) as count, SUM(total_spent) as total_revenue
      FROM vw_customer_type
      GROUP BY customer_type
    `);
    return rows;
  }
}

export const analyticsService = new AnalyticsService();
