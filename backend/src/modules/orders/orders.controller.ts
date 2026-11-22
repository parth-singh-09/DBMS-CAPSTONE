import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';

export class OrdersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ordersService.getAll({
        search: req.query.search as string,
        status: req.query.status as string,
        customer_id: req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined,
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
      const order = await ordersService.getById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Order created successfully with inventory updated in transaction',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const order = await ordersService.updateStatus(id, req.body.status);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({
        success: true,
        message: `Order status updated to ${req.body.status}`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await ordersService.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
