import { Request, Response, NextFunction } from 'express';
import { customersService } from './customers.service.js';

export class CustomersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customersService.getAll({
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
      const customer = await customersService.getById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const customer = await customersService.update(id, req.body);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await customersService.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const customersController = new CustomersController();
