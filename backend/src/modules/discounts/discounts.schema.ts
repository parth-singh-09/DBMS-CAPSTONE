import { z } from 'zod';

export const createDiscountSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, 'Discount code is required').max(20).toUpperCase(),
    discount_type: z.enum(['PERCENT', 'FLAT']).default('PERCENT'),
    value: z.number().positive('Value must be greater than 0'),
    valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid to must be YYYY-MM-DD'),
  }),
});

export const updateDiscountSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1).max(20).toUpperCase().optional(),
    discount_type: z.enum(['PERCENT', 'FLAT']).optional(),
    value: z.number().positive('Value must be greater than 0').optional(),
    valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid to must be YYYY-MM-DD').optional(),
  }),
});
