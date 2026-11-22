import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { updateInventorySchema, adjustStockSchema } from './inventory.schema.js';

export const inventoryRouter = Router();

inventoryRouter.get('/', (req, res, next) => inventoryController.getAll(req, res, next));
inventoryRouter.get('/:id', (req, res, next) => inventoryController.getById(req, res, next));
inventoryRouter.put('/:id', validateRequest(updateInventorySchema), (req, res, next) => inventoryController.update(req, res, next));
inventoryRouter.post('/:id/adjust', validateRequest(adjustStockSchema), (req, res, next) => inventoryController.adjustStock(req, res, next));
inventoryRouter.put('/:id/adjust', validateRequest(adjustStockSchema), (req, res, next) => inventoryController.adjustStock(req, res, next));
