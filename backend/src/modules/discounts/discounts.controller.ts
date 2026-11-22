import { Request, Response, NextFunction } from 'express';
import { discountsService } from './discounts.service.js';

export class DiscountsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountsService.getAll({
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC',
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
      const discount = await discountsService.getById(id);
      if (!discount) {
        return res.status(404).json({ success: false, message: 'Discount not found' });
      }
      res.json({ success: true, data: discount });
    } catch (err) {
      next(err);
    }
  }

  async validateCode(req: Request, res: Response, next: NextFunction) {
    try {
      const code = String(req.params.code);
      const discount = await discountsService.getByCode(code);
      if (!discount) {
        return res.status(404).json({ success: false, message: 'Invalid coupon code' });
      }
      if (!discount.is_active) {
        return res.status(400).json({ success: false, message: 'Coupon code has expired' });
      }
      res.json({ success: true, data: discount });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const discount = await discountsService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Discount created successfully',
        data: discount,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const discount = await discountsService.update(id, req.body);
      if (!discount) {
        return res.status(404).json({ success: false, message: 'Discount not found' });
      }
      res.json({
        success: true,
        message: 'Discount updated successfully',
        data: discount,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await discountsService.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Discount not found' });
      }
      res.json({ success: true, message: 'Discount deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const discountsController = new DiscountsController();
