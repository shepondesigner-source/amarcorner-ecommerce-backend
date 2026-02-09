import { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";

export const PaymentController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await PaymentService.createUserPayment(
        req.user!.id,
        req.body
      );
      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await PaymentService.getAllPayments();
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  },

  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await PaymentService.getPaymentById(
        req.params.id,
        req.user
      );
      res.json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  },

  // getMyPayments: async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const payments = await PaymentService.getUserPayments(req.user!.id);
  //     res.json({ success: true, data: payments });
  //   } catch (err) {
  //     next(err);
  //   }
  // },

  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await PaymentService.updatePaymentStatus(
        req.params.id,
        req.body.status
      );
      res.json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  },
};
