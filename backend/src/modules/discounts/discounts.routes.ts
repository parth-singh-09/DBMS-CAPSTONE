import { Router } from 'express';
import { discountsController } from './discounts.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createDiscountSchema, updateDiscountSchema } from './discounts.schema.js';

export const discountsRouter = Router();

discountsRouter.get('/', (req, res, next) => discountsController.getAll(req, res, next));
discountsRouter.get('/validate/:code', (req, res, next) => discountsController.validateCode(req, res, next));
discountsRouter.get('/:id', (req, res, next) => discountsController.getById(req, res, next));
discountsRouter.post('/', validateRequest(createDiscountSchema), (req, res, next) => discountsController.create(req, res, next));
discountsRouter.put('/:id', validateRequest(updateDiscountSchema), (req, res, next) => discountsController.update(req, res, next));
discountsRouter.delete('/:id', (req, res, next) => discountsController.delete(req, res, next));
