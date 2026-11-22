import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    first_name: z.string().trim().min(1, 'First name is required').max(50),
    last_name: z.string().trim().min(1, 'Last name is required').max(50),
    email: z.string().trim().email('Invalid email address').max(100),
    phone: z.string().trim().max(15).optional().nullable(),
    address: z.string().trim().max(150).optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    first_name: z.string().trim().min(1, 'First name is required').max(50).optional(),
    last_name: z.string().trim().min(1, 'Last name is required').max(50).optional(),
    email: z.string().trim().email('Invalid email address').max(100).optional(),
    phone: z.string().trim().max(15).optional().nullable(),
    address: z.string().trim().max(150).optional().nullable(),
  }),
});
