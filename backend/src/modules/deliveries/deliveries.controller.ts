import { Request, Response, NextFunction } from 'express';
import { deliveriesService } from './deliveries.service.js';

export class DeliveriesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await deliveriesService.getAll({
        search: req.query.search as string,
        courier: req.query.courier as string,
        status: req.query.status as any,
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
      const delivery = await deliveriesService.getById(id);
      if (!delivery) {
        return res.status(404).json({ success: false, message: 'Delivery record not found' });
      }
      res.json({ success: true, data: delivery });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const delivery = await deliveriesService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Delivery record created successfully',
        data: delivery,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const delivery = await deliveriesService.update(id, req.body);
      if (!delivery) {
        return res.status(404).json({ success: false, message: 'Delivery record not found' });
      }
      res.json({
        success: true,
        message: 'Delivery record updated successfully',
        data: delivery,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await deliveriesService.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Delivery record not found' });
      }
      res.json({ success: true, message: 'Delivery record deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const deliveriesController = new DeliveriesController();
