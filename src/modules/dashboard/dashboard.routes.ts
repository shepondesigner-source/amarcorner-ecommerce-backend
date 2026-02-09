import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();



router.get(
  "/stats",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(DashboardController.stats),
);
router.get(
  "/revenue",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(DashboardController.revenue),
);
router.get(
  "/orders",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(DashboardController.orders),
);
router.get(
  "/categories",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(DashboardController.categories),
);
router.get(
  "/top-products",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(DashboardController.topProducts),
);
router.get(
  "/recent-orders",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(DashboardController.recentOrders),
);

export default router;
