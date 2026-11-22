import { Router } from 'express';
import { indexesController } from './indexes.controller.js';

export const indexesRouter = Router();

indexesRouter.get('/', (req, res, next) => indexesController.getAll(req, res, next));
indexesRouter.post('/explain', (req, res, next) => indexesController.explain(req, res, next));
