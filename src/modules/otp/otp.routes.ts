import { Router } from "express";
import * as controller from "./otp.controller";
import { createOtpSchema, verifyOtpSchema } from "./otp.schema";
import { validate } from "../../core/validation/validate";
import { asyncHandler } from "../../core/utils/asyncHandler";

const router = Router();

router.post(
  "/generate",
  validate(createOtpSchema),
  asyncHandler(controller.OtpController.generate)
);

router.post(
  "/verify",
  validate(verifyOtpSchema),
  asyncHandler(controller.OtpController.verify)
);

export default router;
