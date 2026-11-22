import { z } from 'zod';

export const updateInventorySchema = z.object({
  body: z.object({
    qty_on_hand: z.number().int().min(0, 'Quantity on hand cannot be negative').optional(),
    reorder_level: z.number().int().min(0, 'Reorder level cannot be negative').optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    adjustment: z.number().int(), // positive to restock, negative to deplete
    reason: z.string().trim().max(100).optional(),
  }),
});
