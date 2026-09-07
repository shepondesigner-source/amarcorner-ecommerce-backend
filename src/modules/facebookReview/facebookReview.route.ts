import { Router } from "express";
import { FacebookReviewController } from "./facebookReview.controller";
import {
  createFacebookReviewSchema,
  updateFacebookReviewSchema,
  getFacebookReviewSchema,
} from "./facebookReview.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/validation/validate";
import { upload } from "../../core/utils/multer";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  validate(createFacebookReviewSchema),
  asyncHandler(FacebookReviewController.create),
);

router.get("/", asyncHandler(FacebookReviewController.getAll));

router.get(
  "/:id",
  validate(getFacebookReviewSchema),
  asyncHandler(FacebookReviewController.getOne),
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  validate(updateFacebookReviewSchema),
  asyncHandler(FacebookReviewController.update),
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(getFacebookReviewSchema),
  asyncHandler(FacebookReviewController.delete),
);

export default router;
