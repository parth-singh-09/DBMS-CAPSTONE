import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', (req, res, next) => analyticsController.getDashboard(req, res, next));
analyticsRouter.get('/revenue-over-time', (req, res, next) => analyticsController.getRevenueOverTime(req, res, next));
analyticsRouter.get('/best-sellers', (req, res, next) => analyticsController.getBestSellers(req, res, next));
