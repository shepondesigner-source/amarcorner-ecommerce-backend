import { Router } from "express";
import * as controller from "./sub-category.controller";
import { upload } from "../../core/utils/multer";

import { validate } from "../../core/validation/validate";
import {
  createSubCategorySchema,
  updateSubCategorySchema,
} from "./sub-category.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();

router.get("/", controller.findAll);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  validate(createSubCategorySchema),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  validate(updateSubCategorySchema),
  controller.update,
);

router.delete("/:id", authenticate, authorize("ADMIN"), controller.remove);

export default router;
