import { pool, withTransaction } from '../../config/database.js';

export interface DeliveryFilter {
  search?: string;
  courier?: string;
  status?: 'SHIPPED' | 'DELIVERED' | 'PENDING';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class DeliveriesService {
  async getAll(filters: DeliveryFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      delivery_id: 'd.delivery_id',
      order_id: 'd.order_id',
      courier: 'd.courier',
      tracking_no: 'd.tracking_no',
      shipped_on: 'd.shipped_on',
      delivered_on: 'd.delivered_on',
    };

    const sortBy = validSortCols[filters.sortBy || 'delivery_id'] || 'd.delivery_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.courier) {
      whereClause += ` AND d.courier = ?`;
      params.push(filters.courier);
    }

    if (filters.status === 'DELIVERED') {
      whereClause += ` AND d.delivered_on IS NOT NULL`;
    } else if (filters.status === 'SHIPPED') {
      whereClause += ` AND d.shipped_on IS NOT NULL AND d.delivered_on IS NULL`;
    } else if (filters.status === 'PENDING') {
      whereClause += ` AND d.shipped_on IS NULL`;
    }

    if (filters.search) {
      whereClause += ` AND (d.tracking_no LIKE ? OR d.courier LIKE ? OR d.order_id = ? OR c.first_name LIKE ? OR c.last_name LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, isNaN(Number(filters.search)) ? -1 : Number(filters.search), s, s);
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total 
       FROM deliveries d
       JOIN orders o ON o.order_id = d.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT d.delivery_id, d.order_id, d.courier, d.tracking_no, d.shipped_on, d.delivered_on,
              o.order_date, o.status as order_status, o.total_amount,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
              c.address AS customer_address,
              CASE
                WHEN d.delivered_on IS NOT NULL THEN 'DELIVERED'
                WHEN d.shipped_on IS NOT NULL THEN 'SHIPPED'
                ELSE 'PREPARING'
              END AS shipping_status
       FROM deliveries d
       JOIN orders o ON o.order_id = d.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
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

  async getById(id: number) {
    const [rows]: any = await pool.query(
      `SELECT d.delivery_id, d.order_id, d.courier, d.tracking_no, d.shipped_on, d.delivered_on,
              o.order_date, o.status as order_status, o.total_amount,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
              c.address AS customer_address
       FROM deliveries d
       JOIN orders o ON o.order_id = d.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE d.delivery_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data: {
    order_id: number;
    courier: string;
    tracking_no: string;
    shipped_on?: string | null;
    delivered_on?: string | null;
  }) {
    return withTransaction(async (conn) => {
      const [res]: any = await conn.query(
        `INSERT INTO deliveries (order_id, courier, tracking_no, shipped_on, delivered_on) 
         VALUES (?, ?, ?, ?, ?)`,
        [data.order_id, data.courier, data.tracking_no, data.shipped_on || null, data.delivered_on || null]
      );

      // If shipped, update order status to SHIPPED if it was PENDING
      if (data.shipped_on && !data.delivered_on) {
        await conn.query(`UPDATE orders SET status = 'SHIPPED' WHERE order_id = ? AND status = 'PENDING'`, [data.order_id]);
      } else if (data.delivered_on) {
        await conn.query(`UPDATE orders SET status = 'DELIVERED' WHERE order_id = ?`, [data.order_id]);
      }

      return res.insertId;
    }).then((id) => this.getById(id));
  }

  async update(id: number, data: Partial<{
    courier: string;
    tracking_no: string;
    shipped_on: string | null;
    delivered_on: string | null;
  }>) {
    return withTransaction(async (conn) => {
      const existing = await this.getById(id);
      if (!existing) return null;

      const updated = {
        courier: data.courier ?? existing.courier,
        tracking_no: data.tracking_no ?? existing.tracking_no,
        shipped_on: data.shipped_on !== undefined ? data.shipped_on : existing.shipped_on,
        delivered_on: data.delivered_on !== undefined ? data.delivered_on : existing.delivered_on,
      };

      await conn.query(
        `UPDATE deliveries 
         SET courier = ?, tracking_no = ?, shipped_on = ?, delivered_on = ? 
         WHERE delivery_id = ?`,
        [updated.courier, updated.tracking_no, updated.shipped_on, updated.delivered_on, id]
      );

      // Sync order status
      if (updated.delivered_on) {
        await conn.query(`UPDATE orders SET status = 'DELIVERED' WHERE order_id = ?`, [existing.order_id]);
      } else if (updated.shipped_on) {
        await conn.query(`UPDATE orders SET status = 'SHIPPED' WHERE order_id = ? AND status = 'PENDING'`, [existing.order_id]);
      }

      return id;
    }).then((delId) => (delId ? this.getById(delId) : null));
  }

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    await pool.query('DELETE FROM deliveries WHERE delivery_id = ?', [id]);
    return true;
  }
}

export const deliveriesService = new DeliveriesService();
