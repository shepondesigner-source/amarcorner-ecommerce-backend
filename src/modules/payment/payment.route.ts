import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { createPaymentSchema, updatePaymentSchema } from "./payment.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/validation/validate";

const router = Router();

router.use(authenticate);

// User
router.post(
  "/",
  validate(createPaymentSchema),
  asyncHandler(PaymentController.create)
);
router.get("/:id", asyncHandler(PaymentController.getOne));
router.get("/", authorize("ADMIN"), asyncHandler(PaymentController.getAll));
router.put(
  "/:id/status",
  authorize("ADMIN"),
  validate(updatePaymentSchema),
  asyncHandler(PaymentController.updateStatus)
);

export default router;
