import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    product_name: z.string().trim().min(1, 'Product name is required').max(100),
    sku: z.string().trim().max(20).optional().nullable(),
    unit_price: z.number().positive('Unit price must be greater than 0'),
    category_id: z.number().int().positive('Valid category ID is required'),
    initial_stock: z.number().int().min(0, 'Initial stock cannot be negative').optional(),
    reorder_level: z.number().int().min(0).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    product_name: z.string().trim().min(1, 'Product name is required').max(100).optional(),
    sku: z.string().trim().max(20).optional().nullable(),
    unit_price: z.number().positive('Unit price must be greater than 0').optional(),
    category_id: z.number().int().positive('Valid category ID is required').optional(),
  }),
});
