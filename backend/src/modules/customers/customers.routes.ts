import { Router } from 'express';
import { customersController } from './customers.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema } from './customers.schema.js';

export const customersRouter = Router();

customersRouter.get('/', (req, res, next) => customersController.getAll(req, res, next));
customersRouter.get('/:id', (req, res, next) => customersController.getById(req, res, next));
customersRouter.post('/', validateRequest(createCustomerSchema), (req, res, next) => customersController.create(req, res, next));
customersRouter.put('/:id', validateRequest(updateCustomerSchema), (req, res, next) => customersController.update(req, res, next));
customersRouter.delete('/:id', (req, res, next) => customersController.delete(req, res, next));
