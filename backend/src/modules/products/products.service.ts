import { pool, withTransaction } from '../../config/database.js';

export interface ProductFilter {
  search?: string;
  category_id?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class ProductsService {
  async getAll(filters: ProductFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      product_id: 'p.product_id',
      product_name: 'p.product_name',
      sku: 'p.sku',
      unit_price: 'p.unit_price',
      category_name: 'c.category_name',
      qty_on_hand: 'i.qty_on_hand',
    };

    const sortBy = validSortCols[filters.sortBy || 'product_id'] || 'p.product_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.search) {
      whereClause += ` AND (p.product_name LIKE ? OR p.sku LIKE ? OR c.category_name LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    if (filters.category_id) {
      whereClause += ` AND p.category_id = ?`;
      params.push(filters.category_id);
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total 
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN inventory i ON i.product_id = p.product_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT p.product_id, p.product_name, p.sku, p.unit_price, p.category_id,
              c.category_name,
              IFNULL(i.qty_on_hand, 0) as qty_on_hand,
              IFNULL(i.reorder_level, 10) as reorder_level
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN inventory i ON i.product_id = p.product_id
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
      `SELECT p.product_id, p.product_name, p.sku, p.unit_price, p.category_id,
              c.category_name,
              i.inventory_id,
              IFNULL(i.qty_on_hand, 0) as qty_on_hand,
              IFNULL(i.reorder_level, 10) as reorder_level,
              i.last_updated
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN inventory i ON i.product_id = p.product_id
       WHERE p.product_id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async create(data: {
    product_name: string;
    sku?: string | null;
    unit_price: number;
    category_id: number;
    initial_stock?: number;
    reorder_level?: number;
  }) {
    return withTransaction(async (conn) => {
      const [res]: any = await conn.query(
        `INSERT INTO products (product_name, sku, unit_price, category_id) 
         VALUES (?, ?, ?, ?)`,
        [data.product_name, data.sku || null, data.unit_price, data.category_id]
      );
      const newProductId = res.insertId;

      // Automatically create the 1:1 inventory record
      await conn.query(
        `INSERT INTO inventory (product_id, qty_on_hand, reorder_level) 
         VALUES (?, ?, ?)`,
        [newProductId, data.initial_stock ?? 0, data.reorder_level ?? 10]
      );

      return newProductId;
    }).then((id) => this.getById(id));
  }

  async update(id: number, data: Partial<{
    product_name: string;
    sku?: string | null;
    unit_price: number;
    category_id: number;
  }>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      product_name: data.product_name ?? existing.product_name,
      sku: data.sku !== undefined ? data.sku : existing.sku,
      unit_price: data.unit_price ?? existing.unit_price,
      category_id: data.category_id ?? existing.category_id,
    };

    await pool.query(
      `UPDATE products 
       SET product_name = ?, sku = ?, unit_price = ?, category_id = ? 
       WHERE product_id = ?`,
      [updated.product_name, updated.sku, updated.unit_price, updated.category_id, id]
    );

    return this.getById(id);
  }

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    // Delete inventory first if needed, or foreign key will handle / error appropriately
    return withTransaction(async (conn) => {
      await conn.query('DELETE FROM inventory WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM products WHERE product_id = ?', [id]);
      return true;
    });
  }
}

export const productsService = new ProductsService();
