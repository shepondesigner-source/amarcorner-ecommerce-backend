import { Router } from "express";
import { createOrderSchema, updateOrderSchema } from "./order.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/validation/validate";
import {
  createOrderController,
  getOrderListController,
} from "./order.controller";

const router = Router();

router.use(authenticate);

/* ================= USER ROUTES ================= */

// Create order
router.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  asyncHandler(createOrderController),
);

router.get("/", authenticate, asyncHandler(getOrderListController));
router.put(
  "/:id",
  authenticate,
  validate(updateOrderSchema),
  asyncHandler(getOrderListController),
);

export default router;
