import { Request, Response, NextFunction } from 'express';
import { schemaService } from './schema.service.js';

export class SchemaController {
  async getMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await schemaService.getSchemaMetadata();
      res.json({ success: true, data });
    } catch (err: any) {
      next(err);
    }
  }
}

export const schemaController = new SchemaController();
