import { Router } from 'express';
import { testingController } from './testing.controller.js';

export const testingRouter = Router();

testingRouter.post('/run-all', (req, res, next) => testingController.runAll(req, res, next));
testingRouter.get('/consistency', (req, res, next) => testingController.runConsistencyChecks(req, res, next));
