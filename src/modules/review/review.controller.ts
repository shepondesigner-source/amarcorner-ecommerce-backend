// review/review.controller.ts

import { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service";

export class ReviewController {
  private service = new ReviewService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const bodyData = {
        ...req.body,
        userId,
      };

      const review = await this.service.createReview(bodyData);

      res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  getProductReview=async(req: Request, res: Response, next: NextFunction)=>{
 try {
      const params = req.params;
      

      const review = await this.service.productReview(params.id);

      res.status(200).json({
        success: true,
        message: "Success",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const review = await this.service.updateReview(id, req.body);

      res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await this.service.deleteReview(id);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
