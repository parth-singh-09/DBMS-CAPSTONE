import { Router } from 'express';
import { productsController } from './products.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createProductSchema, updateProductSchema } from './products.schema.js';

export const productsRouter = Router();

productsRouter.get('/', (req, res, next) => productsController.getAll(req, res, next));
productsRouter.get('/:id', (req, res, next) => productsController.getById(req, res, next));
productsRouter.post('/', validateRequest(createProductSchema), (req, res, next) => productsController.create(req, res, next));
productsRouter.put('/:id', validateRequest(updateProductSchema), (req, res, next) => productsController.update(req, res, next));
productsRouter.delete('/:id', (req, res, next) => productsController.delete(req, res, next));
