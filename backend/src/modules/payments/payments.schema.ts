import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    order_id: z.number().int().positive('Valid order ID is required'),
    method: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD']),
    amount: z.number().positive('Payment amount must be greater than 0'),
    status: z.enum(['SUCCESS', 'FAILED', 'REFUNDED']).default('SUCCESS'),
    paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Paid on must be YYYY-MM-DD').optional(),
  }),
});

export const updatePaymentSchema = z.object({
  body: z.object({
    method: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD']).optional(),
    amount: z.number().positive().optional(),
    status: z.enum(['SUCCESS', 'FAILED', 'REFUNDED']).optional(),
    paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});
