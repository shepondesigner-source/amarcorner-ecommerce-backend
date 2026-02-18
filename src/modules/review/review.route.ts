// review/review.route.ts

import { Router } from "express";
import { ReviewController } from "./review.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();
const controller = new ReviewController();

router.post("/", authenticate, asyncHandler(controller.create));
router.put(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(controller.update)
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(controller.delete)
);

export default router;
