import { z } from 'zod';

export const createOrderItemSchema = z.object({
  body: z.object({
    order_id: z.number().int().positive('Valid order ID is required'),
    product_id: z.number().int().positive('Valid product ID is required'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    unit_price: z.number().positive('Unit price must be positive').optional(),
  }),
});

export const updateOrderItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be greater than 0'),
  }),
});
