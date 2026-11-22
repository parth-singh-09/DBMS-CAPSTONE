import { pool } from '../../config/database.js';

export interface DiscountFilter {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class DiscountsService {
  async getAll(filters: DiscountFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      discount_id: 'discount_id',
      code: 'code',
      discount_type: 'discount_type',
      value: 'value',
      valid_to: 'valid_to',
    };

    const sortBy = validSortCols[filters.sortBy || 'discount_id'] || 'discount_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.search) {
      whereClause += ` AND code LIKE ?`;
      params.push(`%${filters.search}%`);
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM discounts WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT discount_id, code, discount_type, value, valid_to,
              (valid_to >= CURRENT_DATE) as is_active
       FROM discounts
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
      `SELECT discount_id, code, discount_type, value, valid_to,
              (valid_to >= CURRENT_DATE) as is_active
       FROM discounts WHERE discount_id = ?`,
      [id]
    );
    if (!rows[0]) return null;
    return { ...rows[0], is_active: Boolean(rows[0].is_active) };
  }

  async getByCode(code: string) {
    const [rows]: any = await pool.query(
      `SELECT discount_id, code, discount_type, value, valid_to,
              (valid_to >= CURRENT_DATE) as is_active
       FROM discounts WHERE code = ?`,
      [code.toUpperCase()]
    );
    if (!rows[0]) return null;
    return { ...rows[0], is_active: Boolean(rows[0].is_active) };
  }

  async create(data: { code: string; discount_type?: string; value: number; valid_to: string }) {
    const [result]: any = await pool.query(
      `INSERT INTO discounts (code, discount_type, value, valid_to) VALUES (?, ?, ?, ?)`,
      [data.code.toUpperCase(), data.discount_type || 'PERCENT', data.value, data.valid_to]
    );
    return this.getById(result.insertId);
  }

  async update(id: number, data: Partial<{ code: string; discount_type: string; value: number; valid_to: string }>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      code: data.code ? data.code.toUpperCase() : existing.code,
      discount_type: data.discount_type ?? existing.discount_type,
      value: data.value ?? existing.value,
      valid_to: data.valid_to ?? existing.valid_to,
    };

    await pool.query(
      `UPDATE discounts SET code = ?, discount_type = ?, value = ?, valid_to = ? WHERE discount_id = ?`,
      [updated.code, updated.discount_type, updated.value, updated.valid_to, id]
    );

    return this.getById(id);
  }

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    await pool.query('DELETE FROM discounts WHERE discount_id = ?', [id]);
    return true;
  }
}

export const discountsService = new DiscountsService();
