import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createPaymentSchema, updatePaymentSchema } from './payments.schema.js';

export const paymentsRouter = Router();

paymentsRouter.get('/', (req, res, next) => paymentsController.getAll(req, res, next));
paymentsRouter.get('/:id', (req, res, next) => paymentsController.getById(req, res, next));
paymentsRouter.post('/', validateRequest(createPaymentSchema), (req, res, next) => paymentsController.create(req, res, next));
paymentsRouter.put('/:id', validateRequest(updatePaymentSchema), (req, res, next) => paymentsController.update(req, res, next));
paymentsRouter.delete('/:id', (req, res, next) => paymentsController.delete(req, res, next));
