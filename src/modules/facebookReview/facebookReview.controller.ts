import { Request, Response, NextFunction } from "express";
import { FacebookReviewService } from "./facebookReview.service";

export const FacebookReviewController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await FacebookReviewService.createFacebookReview(
        req.body,
        req.files?.["image"]?.[0],
      );
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewType = req.query.reviewType as any;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const { reviews, total, totalPages } =
        await FacebookReviewService.getAllFacebookReviews({
          reviewType,
          page,
          limit,
        });

      res.json({
        success: true,
        data: reviews,
        ...(total !== undefined && { total, totalPages }),
      });
    } catch (err) {
      next(err);
    }
  },

  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await FacebookReviewService.getFacebookReviewById(
        Number(req.params.id),
      );
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await FacebookReviewService.updateFacebookReview(
        Number(req.params.id),
        req.body,
        req.files?.["image"]?.[0],
      );
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await FacebookReviewService.deleteFacebookReview(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
