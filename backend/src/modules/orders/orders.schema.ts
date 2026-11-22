import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    customer_id: z.number().int().positive('Valid customer ID is required'),
    discount_id: z.number().int().positive().nullable().optional(),
    order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Order date must be YYYY-MM-DD').optional(),
    items: z.array(
      z.object({
        product_id: z.number().int().positive('Valid product ID is required'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
      })
    ).min(1, 'Order must contain at least one item'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});
