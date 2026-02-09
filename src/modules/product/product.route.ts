import { Router } from "express";
import multer from "multer";

import {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
  deleteProductSchema,
  createVendorProductSchema,
} from "./product.schema";
import { validate } from "../../core/validation/validate";
import { asyncHandler } from "../../core/utils/asyncHandler";
import {
  createProduct,
  createVendorProduct,
  deleteProduct,
  getDiscountPricesByIds,
  getdProductDeliveryCharge,
  getFeaturedProduct,
  getNewProducts,
  getProducts,
  getProductsBySlug,
  productById,
  productBySearchText,
  updateProduct,
} from "./product.controller";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();
const upload = multer();

router.post(
  "/",
  upload.array("images", 5),
  validate(createProductSchema),
  asyncHandler(createProduct)
);

router.post(
  "/vendor",
  upload.array("images", 5),
  validate(createVendorProductSchema),
  asyncHandler(createVendorProduct)
);
router.get("/", asyncHandler(getProducts));
router.get("/admin", authenticate, asyncHandler(getProducts));
router.post("/search", asyncHandler(productBySearchText));

router.get("/featured", asyncHandler(getFeaturedProduct));
router.get("/new", asyncHandler(getNewProducts));
router.get("/offer", asyncHandler(getProductsBySlug));

router.get(
  "/rate",
  authenticate,
  authorize("USER"),
  asyncHandler(getdProductDeliveryCharge)
);
router.post("/discount-prices", asyncHandler(getDiscountPricesByIds));

router.get("/:id", asyncHandler(productById));

router.put(
  "/:id",
  upload.array("images", 5),
  validate(updateProductSchema),
  asyncHandler(updateProduct)
);

router.delete(
  "/:id",
  validate(deleteProductSchema),
  asyncHandler(deleteProduct)
);

export default router;
