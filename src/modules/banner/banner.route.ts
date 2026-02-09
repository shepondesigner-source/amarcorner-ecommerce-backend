import { Router } from "express";
import { BannerController } from "./banner.controller";
import { createBannerSchema, updateBannerSchema } from "./banner.schema";
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
  validate(createBannerSchema),
  asyncHandler(BannerController.create)
);

router.get("/", asyncHandler(BannerController.getAll));
router.get("/:id", asyncHandler(BannerController.getOne));

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  validate(updateBannerSchema),
  asyncHandler(BannerController.update)
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(BannerController.delete)
);

export default router;
