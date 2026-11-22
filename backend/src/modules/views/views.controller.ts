import { Request, Response, NextFunction } from 'express';
import { viewsService } from './views.service.js';

export class ViewsController {
  getViews(req: Request, res: Response) {
    const views = viewsService.getViewsMetadata();
    res.json({ success: true, data: views });
  }

  async executeView(req: Request, res: Response, next: NextFunction) {
    try {
      const viewName = String(req.params.name);
      const result = await viewsService.executeView(viewName);
      res.json({ success: true, data: result });
    } catch (err: any) {
      next(err);
    }
  }
}

export const viewsController = new ViewsController();
