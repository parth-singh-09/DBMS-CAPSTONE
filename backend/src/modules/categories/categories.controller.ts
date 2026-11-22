import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service.js';

export class CategoriesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoriesService.getAll({
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
      const category = await categoriesService.getById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const category = await categoriesService.update(id, req.body);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await categoriesService.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const categoriesController = new CategoriesController();
