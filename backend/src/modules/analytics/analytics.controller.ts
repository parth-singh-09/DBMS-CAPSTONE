import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service.js';

export class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        summary,
        revenueOverTime,
        ordersByStatus,
        bestSellers,
        revenueByCategory,
        paymentMethods,
        customerSegments,
      ] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getRevenueOverTime(),
        analyticsService.getOrdersByStatus(),
        analyticsService.getBestSellingProducts(5),
        analyticsService.getRevenueByCategory(),
        analyticsService.getPaymentMethodsDistribution(),
        analyticsService.getCustomerSegmentation(),
      ]);

      res.json({
        success: true,
        data: {
          ...summary,
          charts: {
            revenueOverTime,
            ordersByStatus,
            bestSellers,
            revenueByCategory,
            paymentMethods,
            customerSegments,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getRevenueOverTime(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getRevenueOverTime();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getBestSellers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const data = await analyticsService.getBestSellingProducts(limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
