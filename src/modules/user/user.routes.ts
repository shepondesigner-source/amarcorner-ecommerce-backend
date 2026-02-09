import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAuthenticateUserInfo,
} from "./user.controller";
import { createUserSchema, updateUserSchema } from "./user.schema";
import { validate } from "../../core/validation/validate";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";

const router = Router();

router.post("/", validate(createUserSchema), asyncHandler(createUser));
router.get("/", authenticate, asyncHandler(getUsers));
router.get("/my", authenticate, asyncHandler(getAuthenticateUserInfo));

router.get("/:id", authenticate, asyncHandler(getUserById));
router.put(
  "/:id",
  authenticate,
  validate(updateUserSchema),
  asyncHandler(updateUser)
);
router.delete("/:id", authenticate, asyncHandler(deleteUser));

export default router;
