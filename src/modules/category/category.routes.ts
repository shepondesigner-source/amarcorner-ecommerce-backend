import { Router } from "express";
import * as controller from "./category.controller";
import { upload } from "../../core/utils/multer";

import { validate } from "../../core/validation/validate";
import { createCategorySchema, updateCategorySchema } from "./category.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();

router.get("/", controller.findAll);
router.get("/:id", controller.findById);
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  validate(createCategorySchema),
  controller.create
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  validate(updateCategorySchema),
  controller.update
);

router.delete("/:id", authenticate, authorize("ADMIN"), controller.remove);

export default router;
