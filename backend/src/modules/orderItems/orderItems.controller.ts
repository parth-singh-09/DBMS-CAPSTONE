import { Request, Response, NextFunction } from 'express';
import { orderItemsService } from './orderItems.service.js';

export class OrderItemsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderItemsService.getAll({
        order_id: req.query.order_id ? parseInt(req.query.order_id as string, 10) : undefined,
        product_id: req.query.product_id ? parseInt(req.query.product_id as string, 10) : undefined,
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
      const orderId = parseInt(String(req.params.orderId), 10);
      const productId = parseInt(String(req.params.productId), 10);
      const item = await orderItemsService.getById(orderId, productId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Order item not found' });
      }
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await orderItemsService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Order item added successfully',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = parseInt(String(req.params.orderId), 10);
      const productId = parseInt(String(req.params.productId), 10);
      const item = await orderItemsService.updateQuantity(orderId, productId, req.body.quantity);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Order item not found' });
      }
      res.json({
        success: true,
        message: 'Order item quantity updated successfully',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = parseInt(String(req.params.orderId), 10);
      const productId = parseInt(String(req.params.productId), 10);
      const deleted = await orderItemsService.delete(orderId, productId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Order item not found' });
      }
      res.json({ success: true, message: 'Order item removed and inventory restored' });
    } catch (err) {
      next(err);
    }
  }
}

export const orderItemsController = new OrderItemsController();
