import { Router } from 'express';
import { transactionsController } from './transactions.controller.js';

export const transactionsRouter = Router();

transactionsRouter.post('/demo', (req, res, next) => transactionsController.runDemonstration(req, res, next));
