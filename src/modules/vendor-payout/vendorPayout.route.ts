import { Router } from "express";
import { VendorPayoutController } from "./vendorPayout.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(VendorPayoutController.create),
);

router.get("/", authenticate, asyncHandler(VendorPayoutController.findAll));

router.get("/:id", asyncHandler(VendorPayoutController.findOne));

router.patch("/:id/status", asyncHandler(VendorPayoutController.updateStatus));

router.delete("/:id", asyncHandler(VendorPayoutController.delete));
router.post("/bulk-pay", asyncHandler(VendorPayoutController.bulkPay));
export default router;
