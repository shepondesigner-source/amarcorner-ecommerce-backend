import { Router } from "express";
import { ComplainController } from "./complain.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { authenticate } from "../../core/middlewares/auth.middleware";
import { authorize } from "../../core/middlewares/authorize.middleware";

const router = Router();
const controller = new ComplainController();

router.post("/", asyncHandler(controller.create));
router.get("/", authenticate, authorize("ADMIN"), asyncHandler(controller.getAll));
router.delete("/:id", authenticate, authorize("ADMIN"), asyncHandler(controller.delete));

export default router;
