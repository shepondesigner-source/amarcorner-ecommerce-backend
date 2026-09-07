import { z } from "zod";

const reviewTypeEnum = z.enum(["FACEBOOK", "WHATSAPP", "TIKTOK"]);

export const createFacebookReviewSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    reviewType: reviewTypeEnum.optional(),
  }),
});

export const updateFacebookReviewSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    reviewType: reviewTypeEnum.optional(),
  }),
});

export const getFacebookReviewSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
