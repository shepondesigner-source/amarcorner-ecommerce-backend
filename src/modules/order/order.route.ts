import { Router } from "express";
import {
  addOrderItemSchema,
  updateOrderAmountSchema,
  updateOrderItemSizeSchema,
  updateOrderItemLongSizeSchema,
  updateOrderSchema,
} from "./order.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/validation/validate";
import {
  addOrderItemController,
  createOrderController,
  createOrderControllerOpen,
  deleteOrderController,
  deleteOrderItemController,
  exportContactsController,
  getDayOrdersController,
  getDaysSummaryController,
  getOpenOrderController,
  getOrderListController,
  pathaoOrderController,
  trackOrderController,
  updateOrderController,
  updateOrderItemController,
  updateOrderItemImageController,
  updateOrderItemSizeController,
  updateOrderItemLongSizeController,
  updateOrderPriceController,
} from "./order.controller";

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
router.get("/track", asyncHandler(trackOrderController));
router.get("/day/:day", authenticate, authorize("ADMIN"), asyncHandler(getDayOrdersController));
router.get("/days/summary", authenticate, authorize("ADMIN"), asyncHandler(getDaysSummaryController));
router.get("/contacts/export", authenticate, authorize("ADMIN"), asyncHandler(exportContactsController));
router.post("/pathao", asyncHandler(pathaoOrderController));
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
router.patch(
  "/:orderId/items/:itemId/size",
  authenticate,
  authorize("ADMIN"),
  validate(updateOrderItemSizeSchema),
  asyncHandler(updateOrderItemSizeController),
);
router.patch(
  "/:orderId/items/:itemId/long-size",
  authenticate,
  authorize("ADMIN"),
  validate(updateOrderItemLongSizeSchema),
  asyncHandler(updateOrderItemLongSizeController),
);
router.post(
  "/:orderId/items",
  authenticate,
  authorize("ADMIN"),
  validate(addOrderItemSchema),
  asyncHandler(addOrderItemController),
);
router.patch("/items/:itemId/image", authenticate, authorize("ADMIN"), asyncHandler(updateOrderItemImageController));
router.patch("/items/:itemId", authenticate, authorize("ADMIN"), asyncHandler(updateOrderItemController));
router.delete("/:id", asyncHandler(deleteOrderController));
router.delete("/items/:itemId", authenticate, authorize("ADMIN"), asyncHandler(deleteOrderItemController));

export default router;
