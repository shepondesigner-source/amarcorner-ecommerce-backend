import { Router } from "express";
import {
  createOrderSchema,
  updateOrderAmountSchema,
  updateOrderSchema,
} from "./order.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/validation/validate";
import {
  createOrderController,
  createOrderControllerOpen,
  deleteOrderController,
  getOpenOrderController,
  getOrderListController,
  updateOrderController,
  updateOrderPriceController,
} from "./order.controller";
import { updateOrderAmountService } from "./order.service";

const router = Router();

/* ================= USER ROUTES ================= */

// Create order
router.post(
  "/",
  authenticate,
  // validate(createOrderSchema),
  asyncHandler(createOrderController),
);

router.post("/user", asyncHandler(createOrderControllerOpen));

router.get("/", authenticate, asyncHandler(getOrderListController));
router.get("/:id", asyncHandler(getOpenOrderController));
router.put(
  "/:id",
  authenticate,
  validate(updateOrderSchema),
  asyncHandler(updateOrderController),
);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateOrderAmountSchema),
  asyncHandler(updateOrderPriceController),
);
router.delete("/:id", asyncHandler(deleteOrderController));

export default router;
