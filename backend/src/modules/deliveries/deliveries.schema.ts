import { z } from 'zod';

export const createDeliverySchema = z.object({
  body: z.object({
    order_id: z.number().int().positive('Valid order ID is required'),
    courier: z.string().trim().min(1, 'Courier name is required').max(40),
    tracking_no: z.string().trim().min(1, 'Tracking number is required').max(30),
    shipped_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Shipped date must be YYYY-MM-DD').optional().nullable(),
    delivered_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivered date must be YYYY-MM-DD').optional().nullable(),
  }),
});

export const updateDeliverySchema = z.object({
  body: z.object({
    courier: z.string().trim().min(1).max(40).optional(),
    tracking_no: z.string().trim().min(1).max(30).optional(),
    shipped_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    delivered_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  }),
});
