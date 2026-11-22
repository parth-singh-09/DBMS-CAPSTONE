import { pool, withTransaction } from '../../config/database.js';

export interface OrderItemFilter {
  order_id?: number;
  product_id?: number;
  page?: number;
  limit?: number;
}

export class OrderItemsService {
  async getAll(filters: OrderItemFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.order_id) {
      whereClause += ` AND oi.order_id = ?`;
      params.push(filters.order_id);
    }

    if (filters.product_id) {
      whereClause += ` AND oi.product_id = ?`;
      params.push(filters.product_id);
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM order_items oi WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS line_total,
              p.product_name, p.sku,
              o.order_date, o.status AS order_status,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       JOIN orders o ON o.order_id = oi.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE ${whereClause}
       ORDER BY oi.order_id DESC, oi.product_id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getById(orderId: number, productId: number) {
    const [rows]: any = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS line_total,
              p.product_name, p.sku
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ? AND oi.product_id = ?`,
      [orderId, productId]
    );
    return rows[0] || null;
  }

  async create(data: { order_id: number; product_id: number; quantity: number; unit_price?: number }) {
    return withTransaction(async (conn) => {
      let unitPrice = data.unit_price;
      if (!unitPrice) {
        const [prod]: any = await conn.query(
          `SELECT unit_price FROM products WHERE product_id = ?`,
          [data.product_id]
        );
        if (prod.length === 0) throw new Error('Product not found');
        unitPrice = prod[0].unit_price;
      }

      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
         VALUES (?, ?, ?, ?)`,
        [data.order_id, data.product_id, data.quantity, unitPrice]
      );

      // Decrement inventory
      await conn.query(
        `UPDATE inventory SET qty_on_hand = qty_on_hand - ? WHERE product_id = ?`,
        [data.quantity, data.product_id]
      );

      return true;
    }).then(() => this.getById(data.order_id, data.product_id));
  }

  async updateQuantity(orderId: number, productId: number, newQuantity: number) {
    return withTransaction(async (conn) => {
      const [existing]: any = await conn.query(
        `SELECT quantity FROM order_items WHERE order_id = ? AND product_id = ? FOR UPDATE`,
        [orderId, productId]
      );
      if (existing.length === 0) return null;

      const diff = newQuantity - existing[0].quantity;

      await conn.query(
        `UPDATE order_items SET quantity = ? WHERE order_id = ? AND product_id = ?`,
        [newQuantity, orderId, productId]
      );

      // Adjust inventory based on quantity difference
      await conn.query(
        `UPDATE inventory SET qty_on_hand = qty_on_hand - ? WHERE product_id = ?`,
        [diff, productId]
      );

      return true;
    }).then(() => this.getById(orderId, productId));
  }

  async delete(orderId: number, productId: number) {
    return withTransaction(async (conn) => {
      const [existing]: any = await conn.query(
        `SELECT quantity FROM order_items WHERE order_id = ? AND product_id = ?`,
        [orderId, productId]
      );
      if (existing.length === 0) return false;

      // Restore inventory
      await conn.query(
        `UPDATE inventory SET qty_on_hand = qty_on_hand + ? WHERE product_id = ?`,
        [existing[0].quantity, productId]
      );

      await conn.query(
        `DELETE FROM order_items WHERE order_id = ? AND product_id = ?`,
        [orderId, productId]
      );

      return true;
    });
  }
}

export const orderItemsService = new OrderItemsService();
