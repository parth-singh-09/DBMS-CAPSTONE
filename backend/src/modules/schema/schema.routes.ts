import { Router } from 'express';
import { schemaController } from './schema.controller.js';

export const schemaRouter = Router();

schemaRouter.get('/metadata', (req, res, next) => schemaController.getMetadata(req, res, next));
