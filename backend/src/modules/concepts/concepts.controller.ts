import { Request, Response, NextFunction } from 'express';
import { conceptsService } from './concepts.service.js';

export class ConceptsController {
  async runDdl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await conceptsService.runDdlDemo();
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }

  async runDml(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await conceptsService.runDmlDemo();
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }

  async runDcl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await conceptsService.runDclDemo();
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }
}

export const conceptsController = new ConceptsController();
