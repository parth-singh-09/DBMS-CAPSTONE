import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';

export class InventoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getAll({
        search: req.query.search as string,
        lowStockOnly: req.query.lowStockOnly === 'true',
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
      const inventory = await inventoryService.getById(id);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory record not found' });
      }
      res.json({ success: true, data: inventory });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const inventory = await inventoryService.update(id, req.body);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory record not found' });
      }
      res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: inventory,
      });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const inventory = await inventoryService.adjustStock(id, req.body.adjustment);
      if (!inventory) {
        return res.status(404).json({ success: false, message: 'Inventory record not found' });
      }
      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: inventory,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
