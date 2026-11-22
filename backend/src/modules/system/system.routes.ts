import { Router } from 'express';
import { systemController } from './system.controller.js';

export const systemRouter = Router();

systemRouter.get('/status', (req, res, next) => systemController.getStatus(req, res, next));
systemRouter.post('/reset-seeds', (req, res, next) => systemController.resetToSeeds(req, res, next));
