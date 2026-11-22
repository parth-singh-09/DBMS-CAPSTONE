import { pool } from '../../config/database.js';

export interface PaymentFilter {
  search?: string;
  order_id?: number;
  method?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class PaymentsService {
  async getAll(filters: PaymentFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      payment_id: 'p.payment_id',
      order_id: 'p.order_id',
      method: 'p.method',
      amount: 'p.amount',
      status: 'p.status',
      paid_on: 'p.paid_on',
    };

    const sortBy = validSortCols[filters.sortBy || 'payment_id'] || 'p.payment_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.order_id) {
      whereClause += ` AND p.order_id = ?`;
      params.push(filters.order_id);
    }

    if (filters.method) {
      whereClause += ` AND p.method = ?`;
      params.push(filters.method);
    }

    if (filters.status) {
      whereClause += ` AND p.status = ?`;
      params.push(filters.status);
    }

    if (filters.search) {
      whereClause += ` AND (p.order_id = ? OR c.first_name LIKE ? OR c.last_name LIKE ?)`;
      params.push(
        isNaN(Number(filters.search)) ? -1 : Number(filters.search),
        `%${filters.search}%`,
        `%${filters.search}%`
      );
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total 
       FROM payments p
       JOIN orders o ON o.order_id = p.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT p.payment_id, p.order_id, p.method, p.amount, p.status, p.paid_on,
              o.order_date, o.total_amount AS order_total,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name
       FROM payments p
       JOIN orders o ON o.order_id = p.order_id
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
      `SELECT p.payment_id, p.order_id, p.method, p.amount, p.status, p.paid_on,
              o.order_date, o.total_amount AS order_total,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name
       FROM payments p
       JOIN orders o ON o.order_id = p.order_id
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE p.payment_id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(data: {
    order_id: number;
    method: 'UPI' | 'CARD' | 'NETBANKING' | 'COD';
    amount: number;
    status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
    paid_on?: string;
  }) {
    const paidOn = data.paid_on || new Date().toISOString().split('T')[0];
    const [result]: any = await pool.query(
      `INSERT INTO payments (order_id, method, amount, status, paid_on) 
       VALUES (?, ?, ?, ?, ?)`,
      [data.order_id, data.method, data.amount, data.status, paidOn]
    );
    return this.getById(result.insertId);
  }

  async update(id: number, data: Partial<{
    method: 'UPI' | 'CARD' | 'NETBANKING' | 'COD';
    amount: number;
    status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
    paid_on: string;
  }>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      method: data.method ?? existing.method,
      amount: data.amount ?? existing.amount,
      status: data.status ?? existing.status,
      paid_on: data.paid_on ?? existing.paid_on,
    };

    await pool.query(
      `UPDATE payments 
       SET method = ?, amount = ?, status = ?, paid_on = ? 
       WHERE payment_id = ?`,
      [updated.method, updated.amount, updated.status, updated.paid_on, id]
    );

    return this.getById(id);
  }

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    await pool.query('DELETE FROM payments WHERE payment_id = ?', [id]);
    return true;
  }
}

export const paymentsService = new PaymentsService();
