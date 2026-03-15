import { Request, Response } from "express";
import { VendorPayoutService } from "./vendorPayout.service";
import { VendorPayoutStatus } from "../../../generated/prisma";

export const VendorPayoutController = {
  create: async (req: Request, res: Response) => {
    try {
      const { orderId, shopId, shopOwnerId, amount } = req.body;

      const payout = await VendorPayoutService.create({
        orderId,
        shopId,
        shopOwnerId,
        amount,
      });

      res.json(payout);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payout" });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const payouts = await VendorPayoutService.findAll(
        req.user?.id!,
        req.user?.role!
      );

      res.json(payouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  },

  findOne: async (req: Request, res: Response) => {
    try {
      const payout = await VendorPayoutService.findById(req.params.id);

      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }

      res.json(payout);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payout" });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { status, adminMessage } = req.body;

      const payout = await VendorPayoutService.updateStatus(
        req.params.id,
        status as VendorPayoutStatus,
        adminMessage
      );

      res.json(payout);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payout" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await VendorPayoutService.delete(req.params.id);

      res.json({ message: "Payout deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payout" });
    }
  },
};