import { Router } from 'express';
import { viewsController } from './views.controller.js';

export const viewsRouter = Router();

viewsRouter.get('/', (req, res) => viewsController.getViews(req, res));
viewsRouter.get('/:name/data', (req, res, next) => viewsController.executeView(req, res, next));
