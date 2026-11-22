import { pool, withTransaction } from '../../config/database.js';

export interface OrderFilter {
  search?: string;
  status?: string;
  customer_id?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface CreateOrderItemInput {
  product_id: number;
  quantity: number;
}

export interface CreateOrderInput {
  customer_id: number;
  discount_id?: number | null;
  order_date?: string;
  items: CreateOrderItemInput[];
}

export class OrdersService {
  async getAll(filters: OrderFilter) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 10));
    const offset = (page - 1) * limit;

    const validSortCols: Record<string, string> = {
      order_id: 'o.order_id',
      order_date: 'o.order_date',
      customer_name: 'c.first_name',
      status: 'o.status',
      total_amount: 'o.total_amount',
    };

    const sortBy = validSortCols[filters.sortBy || 'order_id'] || 'o.order_id';
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = '1=1';
    const params: any[] = [];

    if (filters.search) {
      whereClause += ` AND (CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR o.order_id = ?)`;
      params.push(`%${filters.search}%`, isNaN(Number(filters.search)) ? -1 : Number(filters.search));
    }

    if (filters.status) {
      whereClause += ` AND o.status = ?`;
      params.push(filters.status);
    }

    if (filters.customer_id) {
      whereClause += ` AND o.customer_id = ?`;
      params.push(filters.customer_id);
    }

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) as total 
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows]: any = await pool.query(
      `SELECT o.order_id, o.customer_id, o.discount_id, o.order_date, o.status, o.total_amount,
              CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
              c.email AS customer_email,
              d.code AS discount_code,
              d.value AS discount_value,
              (del.delivery_id IS NOT NULL) AS has_delivery,
              del.courier,
              del.tracking_no,
              IFNULL(SUM(p.amount), 0) AS total_paid
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       LEFT JOIN discounts d ON d.discount_id = o.discount_id
       LEFT JOIN deliveries del ON del.order_id = o.order_id
       LEFT JOIN payments p ON p.order_id = o.order_id AND p.status = 'SUCCESS'
       WHERE ${whereClause}
       GROUP BY o.order_id, o.customer_id, o.discount_id, o.order_date, o.status, o.total_amount,
                customer_name, customer_email, discount_code, discount_value,
                del.delivery_id, del.courier, del.tracking_no
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
    const [orders]: any = await pool.query(
      `SELECT o.order_id, o.customer_id, o.discount_id, o.order_date, o.status, o.total_amount,
              c.first_name, c.last_name, c.email, c.phone, c.address,
              d.code AS discount_code, d.discount_type, d.value AS discount_value,
              del.delivery_id, del.courier, del.tracking_no, del.shipped_on, del.delivered_on
       FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id
       LEFT JOIN discounts d ON d.discount_id = o.discount_id
       LEFT JOIN deliveries del ON del.order_id = o.order_id
       WHERE o.order_id = ?`,
      [id]
    );

    if (orders.length === 0) return null;
    const order = orders[0];

    // Fetch line items
    const [items]: any = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
              (oi.quantity * oi.unit_price) AS line_total,
              p.product_name, p.sku
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    // Fetch payments
    const [payments]: any = await pool.query(
      `SELECT payment_id, method, amount, status, paid_on 
       FROM payments 
       WHERE order_id = ? 
       ORDER BY paid_on ASC, payment_id ASC`,
      [id]
    );

    return {
      ...order,
      items,
      payments,
    };
  }

  async create(data: CreateOrderInput) {
    return withTransaction(async (conn) => {
      // 1. Verify customer
      const [custRows]: any = await conn.query(
        `SELECT customer_id FROM customers WHERE customer_id = ?`,
        [data.customer_id]
      );
      if (custRows.length === 0) {
        throw new Error(`Customer with ID ${data.customer_id} does not exist`);
      }

      // 2. Process each item: check stock, verify price
      let subtotal = 0;
      const verifiedItems: { product_id: number; quantity: number; unit_price: number }[] = [];

      for (const item of data.items) {
        const [prodRows]: any = await conn.query(
          `SELECT p.product_id, p.product_name, p.unit_price, i.qty_on_hand 
           FROM products p 
           JOIN inventory i ON i.product_id = p.product_id 
           WHERE p.product_id = ? 
           FOR UPDATE`,
          [item.product_id]
        );

        if (prodRows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} does not exist`);
        }

        const product = prodRows[0];
        if (product.qty_on_hand < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.product_name}". Available: ${product.qty_on_hand}, Requested: ${item.quantity}`
          );
        }

        const unit_price = Number(product.unit_price);
        subtotal += unit_price * item.quantity;

        verifiedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price,
        });
      }

      // 3. Process discount if supplied
      let discountAmount = 0;
      let finalDiscountId: number | null = null;

      if (data.discount_id) {
        const [discRows]: any = await conn.query(
          `SELECT discount_id, code, discount_type, value, valid_to 
           FROM discounts 
           WHERE discount_id = ?`,
          [data.discount_id]
        );

        if (discRows.length > 0) {
          const discount = discRows[0];
          finalDiscountId = discount.discount_id;
          if (discount.discount_type === 'PERCENT') {
            discountAmount = (subtotal * Number(discount.value)) / 100;
          } else {
            discountAmount = Number(discount.value);
          }
        }
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);
      const orderDate = data.order_date || new Date().toISOString().split('T')[0];

      // 4. Insert order
      const [orderRes]: any = await conn.query(
        `INSERT INTO orders (customer_id, discount_id, order_date, status, total_amount) 
         VALUES (?, ?, ?, 'PENDING', ?)`,
        [data.customer_id, finalDiscountId, orderDate, totalAmount]
      );
      const newOrderId = orderRes.insertId;

      // 5. Insert order items & decrease stock
      for (const item of verifiedItems) {
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) 
           VALUES (?, ?, ?, ?)`,
          [newOrderId, item.product_id, item.quantity, item.unit_price]
        );

        await conn.query(
          `UPDATE inventory 
           SET qty_on_hand = qty_on_hand - ?, last_updated = CURRENT_TIMESTAMP 
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      }

      return newOrderId;
    }).then((id) => this.getById(id));
  }

  async updateStatus(id: number, status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') {
    return withTransaction(async (conn) => {
      const [orders]: any = await conn.query(`SELECT status FROM orders WHERE order_id = ? FOR UPDATE`, [id]);
      if (orders.length === 0) return null;

      const oldStatus = orders[0].status;
      if (oldStatus === status) return this.getById(id);

      // If cancelling from non-cancelled status, restore stock
      if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        const [items]: any = await conn.query(
          `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
          [id]
        );
        for (const item of items) {
          await conn.query(
            `UPDATE inventory SET qty_on_hand = qty_on_hand + ? WHERE product_id = ?`,
            [item.quantity, item.product_id]
          );
        }
      }

      await conn.query(`UPDATE orders SET status = ? WHERE order_id = ?`, [status, id]);
      return id;
    }).then((orderId) => (orderId ? this.getById(orderId) : null));
  }

  async delete(id: number) {
    return withTransaction(async (conn) => {
      const [orders]: any = await conn.query(`SELECT status FROM orders WHERE order_id = ?`, [id]);
      if (orders.length === 0) return false;

      // Clean up dependent child rows if user deletes order
      await conn.query('DELETE FROM payments WHERE order_id = ?', [id]);
      await conn.query('DELETE FROM deliveries WHERE order_id = ?', [id]);
      await conn.query('DELETE FROM order_items WHERE order_id = ?', [id]);
      await conn.query('DELETE FROM orders WHERE order_id = ?', [id]);
      return true;
    });
  }
}

export const ordersService = new OrdersService();
