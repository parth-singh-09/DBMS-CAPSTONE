import { Request, Response, NextFunction } from 'express';
import { queryLabService } from './queryLab.service.js';

export class QueryLabController {
  getCatalog(req: Request, res: Response) {
    const catalog = queryLabService.getCatalog();
    res.json({ success: true, data: catalog });
  }

  async executePredefined(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await queryLabService.executePredefined(id);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }

  async executeCustom(req: Request, res: Response, next: NextFunction) {
    try {
      const { sql } = req.body;
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ success: false, message: 'SQL query string is required in request body.' });
      }
      const result = await queryLabService.executeQuery(sql);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }
}

export const queryLabController = new QueryLabController();
