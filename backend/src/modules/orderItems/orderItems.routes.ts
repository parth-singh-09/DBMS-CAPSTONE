import { Router } from 'express';
import { orderItemsController } from './orderItems.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createOrderItemSchema, updateOrderItemSchema } from './orderItems.schema.js';

export const orderItemsRouter = Router();

orderItemsRouter.get('/', (req, res, next) => orderItemsController.getAll(req, res, next));
orderItemsRouter.get('/:orderId/:productId', (req, res, next) => orderItemsController.getById(req, res, next));
orderItemsRouter.post('/', validateRequest(createOrderItemSchema), (req, res, next) => orderItemsController.create(req, res, next));
orderItemsRouter.put('/:orderId/:productId', validateRequest(updateOrderItemSchema), (req, res, next) => orderItemsController.updateQuantity(req, res, next));
orderItemsRouter.delete('/:orderId/:productId', (req, res, next) => orderItemsController.delete(req, res, next));
