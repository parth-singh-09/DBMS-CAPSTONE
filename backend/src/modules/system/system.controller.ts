import { Request, Response, NextFunction } from 'express';
import { systemService } from './system.service.js';

export class SystemController {
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await systemService.getStatus();
      res.json({ success: true, data });
    } catch (err: any) {
      next(err);
    }
  }

  async resetToSeeds(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemService.resetToSeeds();
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }
}

export const systemController = new SystemController();
