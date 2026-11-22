import { pool } from '../../config/database.js';

export interface InventoryFilter {
  search?: string;
  lowStockOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export class InventoryService {
  async getAll(filters: InventoryFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      inventory_id: 'i.inventory_id',
      product_name: 'p.product_name',
      qty_on_hand: 'i.qty_on_hand',
      reorder_level: 'i.reorder_level',
      last_updated: 'i.last_updated',
    };

    const sortBy = validSortCols[filters.sortBy || 'inventory_id'] || 'i.inventory_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.search) {
      whereClause += ` AND (p.product_name LIKE ? OR p.sku LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s);
    }

    if (filters.lowStockOnly) {
      whereClause += ` AND i.qty_on_hand <= i.reorder_level`;
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total 
       FROM inventory i
       JOIN products p ON p.product_id = i.product_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT i.inventory_id, i.product_id, i.qty_on_hand, i.reorder_level, i.last_updated,
              p.product_name, p.sku, p.unit_price,
              (i.qty_on_hand <= i.reorder_level) as is_low_stock
       FROM inventory i
       JOIN products p ON p.product_id = i.product_id
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
      `SELECT i.inventory_id, i.product_id, i.qty_on_hand, i.reorder_level, i.last_updated,
              p.product_name, p.sku, p.unit_price,
              (i.qty_on_hand <= i.reorder_level) as is_low_stock
       FROM inventory i
       JOIN products p ON p.product_id = i.product_id
       WHERE i.inventory_id = ? OR i.product_id = ?`,
      [id, id]
    );
    return rows[0] || null;
  }

  async update(id: number, data: { qty_on_hand?: number; reorder_level?: number }) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      qty_on_hand: data.qty_on_hand !== undefined ? data.qty_on_hand : existing.qty_on_hand,
      reorder_level: data.reorder_level !== undefined ? data.reorder_level : existing.reorder_level,
    };

    await pool.query(
      `UPDATE inventory 
       SET qty_on_hand = ?, reorder_level = ?, last_updated = CURRENT_TIMESTAMP 
       WHERE inventory_id = ?`,
      [updated.qty_on_hand, updated.reorder_level, existing.inventory_id]
    );

    return this.getById(existing.inventory_id);
  }

  async adjustStock(id: number, adjustment: number) {
    const existing = await this.getById(id);
    if (!existing) return null;

    // Direct SQL update enforces CHECK (qty_on_hand >= 0)
    await pool.query(
      `UPDATE inventory 
       SET qty_on_hand = qty_on_hand + ?, last_updated = CURRENT_TIMESTAMP 
       WHERE inventory_id = ?`,
      [adjustment, existing.inventory_id]
    );

    return this.getById(existing.inventory_id);
  }
}

export const inventoryService = new InventoryService();
