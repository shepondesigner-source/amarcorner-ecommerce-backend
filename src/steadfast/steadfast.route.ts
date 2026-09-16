import { Router } from "express";
import { authenticate } from "../core/middlewares/auth.middleware";
import { authorize } from "../core/middlewares/authorize.middleware";
import { asyncHandler } from "../core/utils/asyncHandler";
import {
  createSteadfastFromOrderController,
  createSteadfastOrderController,
} from "./steadfast.controller";

const router = Router();

// Order management — admin only
router.post(
  "/orders",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(createSteadfastOrderController),
);
router.post(
  "/orders/from-order",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(createSteadfastFromOrderController),
);

export default router;
