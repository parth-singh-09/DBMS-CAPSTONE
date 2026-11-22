import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from './orders.schema.js';

export const ordersRouter = Router();

ordersRouter.get('/', (req, res, next) => ordersController.getAll(req, res, next));
ordersRouter.get('/:id', (req, res, next) => ordersController.getById(req, res, next));
ordersRouter.post('/', validateRequest(createOrderSchema), (req, res, next) => ordersController.create(req, res, next));
ordersRouter.patch('/:id/status', validateRequest(updateOrderStatusSchema), (req, res, next) => ordersController.updateStatus(req, res, next));
ordersRouter.put('/:id/status', validateRequest(updateOrderStatusSchema), (req, res, next) => ordersController.updateStatus(req, res, next));
ordersRouter.delete('/:id', (req, res, next) => ordersController.delete(req, res, next));
