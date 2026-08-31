import { Router } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { NotFoundError } from "../../core/errors/HttpError";
import { resolveShortLink } from "./shortlink.service";

const router = Router();

router.get(
  "/:code",
  asyncHandler(async (req, res) => {
    const url = await resolveShortLink(req.params.code);
    if (!url) throw new NotFoundError("Short link not found");
    res.json({ url });
  }),
);

export default router;
