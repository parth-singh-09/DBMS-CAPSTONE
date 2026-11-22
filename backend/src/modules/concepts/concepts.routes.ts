import { Router } from 'express';
import { conceptsController } from './concepts.controller.js';

export const conceptsRouter = Router();

conceptsRouter.post('/ddl', (req, res, next) => conceptsController.runDdl(req, res, next));
conceptsRouter.post('/dml', (req, res, next) => conceptsController.runDml(req, res, next));
conceptsRouter.post('/dcl', (req, res, next) => conceptsController.runDcl(req, res, next));
