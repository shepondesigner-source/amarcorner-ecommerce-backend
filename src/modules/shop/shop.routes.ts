import { Router } from "express";
import multer from "multer";
import {
  createShop,
  getShops,
  updateShop,
  deleteShop,
  getShopsByUser,
} from "./shop.controller";
import {
  createShopSchema,
  updateShopSchema,
  getShopsSchema,
  deleteShopSchema,
} from "./shop.schema";
import { validate } from "../../core/validation/validate";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";

const router = Router();
const upload = multer();

router.post(
  "/",
  authenticate,
  upload.single("image"),
  validate(createShopSchema),
  asyncHandler(createShop),
);

router.get("/", authenticate, validate(getShopsSchema), asyncHandler(getShops));

router.get("/user/:id", asyncHandler(getShopsByUser));

router.put(
  "/:id",
  authenticate,
  upload.single("image"),
  validate(updateShopSchema),
  asyncHandler(updateShop),
);

router.delete("/:id", validate(deleteShopSchema), asyncHandler(deleteShop));

export default router;
