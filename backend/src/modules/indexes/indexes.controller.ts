import { Request, Response, NextFunction } from 'express';
import { indexesService } from './indexes.service.js';

export class IndexesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await indexesService.getAllIndexes();
      res.json({ success: true, data });
    } catch (err: any) {
      next(err);
    }
  }

  async explain(req: Request, res: Response, next: NextFunction) {
    try {
      const { sql } = req.body;
      const defaultSql = 'SELECT * FROM orders WHERE customer_id = 1;';
      const queryToExplain = sql || defaultSql;
      const result = await indexesService.explainQuery(queryToExplain);
      res.json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  }
}

export const indexesController = new IndexesController();
