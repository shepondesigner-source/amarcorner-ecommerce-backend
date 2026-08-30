import { Router } from "express";
import { validate } from "../../core/validation/validate";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";
import { sendSmsSchema, getDeliveryReportSchema } from "./sms.schema";
import {
  sendSms,
  getSmsBalance,
  getSmsPrice,
  getSmsDeliveryReport,
  getSmsUnreadReplies,
} from "./sms.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/send", validate(sendSmsSchema), asyncHandler(sendSms));

router.get("/balance", asyncHandler(getSmsBalance));
router.get("/price", asyncHandler(getSmsPrice));
router.get("/replies", asyncHandler(getSmsUnreadReplies));

router.get(
  "/delivery-report",
  validate(getDeliveryReportSchema),
  asyncHandler(getSmsDeliveryReport),
);
router.get(
  "/delivery-report/:shootId",
  validate(getDeliveryReportSchema),
  asyncHandler(getSmsDeliveryReport),
);

export default router;
