import { Request, Response, NextFunction } from 'express';
import { transactionsService } from './transactions.service.js';

export class TransactionsController {
  async runDemonstration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionsService.runFullDemonstration();
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }
}

export const transactionsController = new TransactionsController();
