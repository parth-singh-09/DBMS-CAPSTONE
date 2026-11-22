import { pool } from '../../config/database.js';

export interface CustomerFilter {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class CustomersService {
  async getAll(filters: CustomerFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      customer_id: 'customer_id',
      first_name: 'first_name',
      last_name: 'last_name',
      email: 'email',
      phone: 'phone',
      address: 'address',
    };

    const sortBy = validSortCols[filters.sortBy || 'customer_id'] || 'customer_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.search) {
      whereClause += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s, s, s);
    }

    // Total count
    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM customers WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Data query
    const [rows]: any = await pool.query(
      `SELECT customer_id, first_name, last_name, email, phone, address 
       FROM customers 
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
      `SELECT customer_id, first_name, last_name, email, phone, address 
       FROM customers WHERE customer_id = ?`,
      [id]
    );
    if (rows.length === 0) return null;

    // Also get orders summary for this customer
    const [orders]: any = await pool.query(
      `SELECT order_id, order_date, status, total_amount 
       FROM orders WHERE customer_id = ? ORDER BY order_date DESC`,
      [id]
    );

    return {
      ...rows[0],
      orders,
    };
  }

  async create(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  }) {
    const [result]: any = await pool.query(
      `INSERT INTO customers (first_name, last_name, email, phone, address) 
       VALUES (?, ?, ?, ?, ?)`,
      [data.first_name, data.last_name, data.email, data.phone || null, data.address || null]
    );
    return this.getById(result.insertId);
  }

  async update(id: number, data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  }>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      first_name: data.first_name ?? existing.first_name,
      last_name: data.last_name ?? existing.last_name,
      email: data.email ?? existing.email,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      address: data.address !== undefined ? data.address : existing.address,
    };

    await pool.query(
      `UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ? 
       WHERE customer_id = ?`,
      [updated.first_name, updated.last_name, updated.email, updated.phone, updated.address, id]
    );

    return this.getById(id);
  }

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    await pool.query('DELETE FROM customers WHERE customer_id = ?', [id]);
    return true;
  }
}

export const customersService = new CustomersService();
