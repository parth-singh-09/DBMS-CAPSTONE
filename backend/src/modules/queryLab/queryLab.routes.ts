import { Router } from 'express';
import { queryLabController } from './queryLab.controller.js';

export const queryLabRouter = Router();

queryLabRouter.get('/catalog', (req, res) => queryLabController.getCatalog(req, res));
queryLabRouter.post('/predefined/:id', (req, res, next) => queryLabController.executePredefined(req, res, next));
queryLabRouter.post('/execute', (req, res, next) => queryLabController.executeCustom(req, res, next));
