import { Router } from "express";
import {
  createLongSize,
  getLongSizes,
  updateLongSize,
  deleteLongSize,
} from "./longSize.controller";
import { createLongSizeSchema, updateLongSizeSchema } from "./longSize.schema";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/validation/validate";

const router = Router();

router.post("/", validate(createLongSizeSchema), asyncHandler(createLongSize));
router.get("/", asyncHandler(getLongSizes));
router.put("/:id", validate(updateLongSizeSchema), asyncHandler(updateLongSize));
router.delete("/:id", asyncHandler(deleteLongSize));

export default router;
