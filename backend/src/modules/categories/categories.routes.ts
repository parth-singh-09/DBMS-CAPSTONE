import { Router } from 'express';
import { categoriesController } from './categories.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './categories.schema.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', (req, res, next) => categoriesController.getAll(req, res, next));
categoriesRouter.get('/:id', (req, res, next) => categoriesController.getById(req, res, next));
categoriesRouter.post('/', validateRequest(createCategorySchema), (req, res, next) => categoriesController.create(req, res, next));
categoriesRouter.put('/:id', validateRequest(updateCategorySchema), (req, res, next) => categoriesController.update(req, res, next));
categoriesRouter.delete('/:id', (req, res, next) => categoriesController.delete(req, res, next));
