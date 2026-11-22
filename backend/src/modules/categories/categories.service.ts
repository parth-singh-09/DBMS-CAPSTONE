import { pool } from '../../config/database.js';

export interface CategoryFilter {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class CategoriesService {
  async getAll(filters: CategoryFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      category_id: 'c.category_id',
      category_name: 'c.category_name',
      description: 'c.description',
      products_count: 'products_count',
    };

    const sortBy = validSortCols[filters.sortBy || 'category_id'] || 'c.category_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.search) {
      whereClause += ` AND (c.category_name LIKE ? OR c.description LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s);
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM categories c WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT c.category_id, c.category_name, c.description,
              COUNT(p.product_id) AS products_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.category_id
       WHERE ${whereClause}
       GROUP BY c.category_id, c.category_name, c.description
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
      `SELECT c.category_id, c.category_name, c.description,
              COUNT(p.product_id) AS products_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.category_id
       WHERE c.category_id = ?
       GROUP BY c.category_id, c.category_name, c.description`,
      [id]
    );
    if (rows.length === 0) return null;

    const [products]: any = await pool.query(
      `SELECT product_id, product_name, sku, unit_price 
       FROM products WHERE category_id = ?`,
      [id]
    );

    return {
      ...rows[0],
      products,
    };
  }

  async create(data: { category_name: string; description?: string | null }) {
    const [result]: any = await pool.query(
      `INSERT INTO categories (category_name, description) VALUES (?, ?)`,
      [data.category_name, data.description || null]
    );
    return this.getById(result.insertId);
  }

  async update(id: number, data: Partial<{ category_name: string; description?: string | null }>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      category_name: data.category_name ?? existing.category_name,
      description: data.description !== undefined ? data.description : existing.description,
    };

    await pool.query(
      `UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?`,
      [updated.category_name, updated.description, id]
    );

    return this.getById(id);
  }

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
    return true;
  }
}

export const categoriesService = new CategoriesService();
