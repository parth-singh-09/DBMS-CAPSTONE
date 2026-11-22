import { Request, Response, NextFunction } from 'express';
import { testingService } from './testing.service.js';

export class TestingController {
  async runAll(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await testingService.runAllTests();
      res.json({ success: true, data: results });
    } catch (err: any) {
      next(err);
    }
  }

  async runConsistencyChecks(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await testingService.runConsistencyChecks();
      res.json({ success: true, data: results });
    } catch (err: any) {
      next(err);
    }
  }
}

export const testingController = new TestingController();
