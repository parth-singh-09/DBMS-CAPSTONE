import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    category_name: z.string().trim().min(1, 'Category name is required').max(50),
    description: z.string().trim().max(100).optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    category_name: z.string().trim().min(1, 'Category name is required').max(50).optional(),
    description: z.string().trim().max(100).optional().nullable(),
  }),
});
