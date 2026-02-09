import { Router } from "express";
import {
  createSize,
  getSizes,
  updateSize,
  deleteSize,
} from "./size.controller";
import { createSizeSchema, updateSizeSchema } from "./size.schema";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validate } from "../../core/validation/validate";

const router = Router();

router.post("/", validate(createSizeSchema), asyncHandler(createSize));
router.get("/", asyncHandler(getSizes));
router.put("/:id", validate(updateSizeSchema), asyncHandler(updateSize));
router.delete("/:id", asyncHandler(deleteSize));

export default router;
