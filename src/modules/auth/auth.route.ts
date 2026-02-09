import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../core/validation/validate";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.schema";
import { authenticate } from "../../core/middlewares/auth.middleware";

const router = Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshTokenSchema), controller.refreshToken);
router.post("/password-change", authenticate, controller.updatePassword);

export default router;
