import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service.js';

export class ProductsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productsService.getAll({
        search: req.query.search as string,
        category_id: req.query.category_id ? parseInt(req.query.category_id as string, 10) : undefined,
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
      const product = await productsService.getById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const product = await productsService.update(id, req.body);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await productsService.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const productsController = new ProductsController();
