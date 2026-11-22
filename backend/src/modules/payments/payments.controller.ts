import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service.js';

export class PaymentsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.getAll({
        search: req.query.search as string,
        order_id: req.query.order_id ? parseInt(req.query.order_id as string, 10) : undefined,
        method: req.query.method as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const payment = await paymentsService.getById(id);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      res.json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const payment = await paymentsService.update(id, req.body);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      res.json({
        success: true,
        message: 'Payment record updated successfully',
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await paymentsService.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      res.json({ success: true, message: 'Payment record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentsController = new PaymentsController();
