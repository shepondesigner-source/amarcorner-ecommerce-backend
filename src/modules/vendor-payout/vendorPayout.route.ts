import { Router } from "express";
import { VendorPayoutController } from "./vendorPayout.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";

const router = Router();

router.post("/", asyncHandler(VendorPayoutController.create));

router.get("/", asyncHandler(VendorPayoutController.findAll));

router.get("/:id", asyncHandler(VendorPayoutController.findOne));

router.patch("/:id/status", asyncHandler(VendorPayoutController.updateStatus));

router.delete("/:id", asyncHandler(VendorPayoutController.delete));

export default router;
