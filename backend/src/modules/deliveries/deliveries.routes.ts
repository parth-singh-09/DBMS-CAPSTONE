import { Router } from 'express';
import { deliveriesController } from './deliveries.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createDeliverySchema, updateDeliverySchema } from './deliveries.schema.js';

export const deliveriesRouter = Router();

deliveriesRouter.get('/', (req, res, next) => deliveriesController.getAll(req, res, next));
deliveriesRouter.get('/:id', (req, res, next) => deliveriesController.getById(req, res, next));
deliveriesRouter.post('/', validateRequest(createDeliverySchema), (req, res, next) => deliveriesController.create(req, res, next));
deliveriesRouter.put('/:id', validateRequest(updateDeliverySchema), (req, res, next) => deliveriesController.update(req, res, next));
deliveriesRouter.delete('/:id', (req, res, next) => deliveriesController.delete(req, res, next));
