import { Router } from "express";
import { authenticate } from "../core/middlewares/auth.middleware";
import { authorize } from "../core/middlewares/authorize.middleware";
import { asyncHandler } from "../core/utils/asyncHandler";
import {
  cancelCarrybeeOrderController,
  createCarrybeeFromOrderController,
  createCarrybeeOrderController,
  createStoreController,
  getAreasController,
  getCitiesController,
  getStoresController,
  getZonesController,
  trackCarrybeeOrderController,
} from "./carrybee.controller";

const router = Router();

// Reference data — public (used by frontend dropdowns)
router.get("/cities", asyncHandler(getCitiesController));
router.get("/zones", asyncHandler(getZonesController));
router.get("/areas", asyncHandler(getAreasController));

// Stores — admin only
router.get("/stores", authenticate, authorize("ADMIN"), asyncHandler(getStoresController));
router.post("/stores", authenticate, authorize("ADMIN"), asyncHandler(createStoreController));

// Order management — admin only
router.post("/orders", authenticate, authorize("ADMIN"), asyncHandler(createCarrybeeOrderController));
router.post("/orders/from-order", authenticate, authorize("ADMIN"), asyncHandler(createCarrybeeFromOrderController));
router.get("/orders/:consignmentId", authenticate, authorize("ADMIN"), asyncHandler(trackCarrybeeOrderController));
router.delete("/orders/:consignmentId", authenticate, authorize("ADMIN"), asyncHandler(cancelCarrybeeOrderController));

export default router;
