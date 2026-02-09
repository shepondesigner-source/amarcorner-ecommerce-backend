import { Router } from "express";
import { validate } from "../../core/validation/validate";
import { createAddressSchema, updateAddressSchema } from "./address.schema";
import { ShippingAddressController } from "./address.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("USER"),
  validate(createAddressSchema),
  asyncHandler(ShippingAddressController.create)
);
router.get(
  "/",
  authenticate,
  authorize("USER"),
  asyncHandler(ShippingAddressController.getMy)
);

router.put(
  "/:id",
  authenticate,
  authorize("USER"),
  validate(updateAddressSchema),
  asyncHandler(ShippingAddressController.update)
);

router.patch(
  "/:id/default",
  authenticate,
  authorize("USER"),

  asyncHandler(ShippingAddressController.updateDefault)
);

router.delete(
  "/:id",
  authenticate,
  authorize("USER"),
  asyncHandler(ShippingAddressController.delete)
);

export default router;
