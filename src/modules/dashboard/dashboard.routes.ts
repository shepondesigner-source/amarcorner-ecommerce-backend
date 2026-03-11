import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();

router.get(
  "/stats",
  authenticate,

  asyncHandler(DashboardController.stats)
);
router.get(
  "/revenue",
  authenticate,

  asyncHandler(DashboardController.revenue)
);
router.get(
  "/orders",
  authenticate,

  asyncHandler(DashboardController.orders)
);
router.get(
  "/categories",
  authenticate,

  asyncHandler(DashboardController.categories)
);
router.get(
  "/top-products",
  authenticate,

  asyncHandler(DashboardController.topProducts)
);
router.get(
  "/recent-orders",
  authenticate,
  asyncHandler(DashboardController.recentOrders)
);

router.get(
  "/shop-analytic/:shopId",
  // authenticate,
  asyncHandler(DashboardController.shopTotalOrderCount)
);

export default router;
