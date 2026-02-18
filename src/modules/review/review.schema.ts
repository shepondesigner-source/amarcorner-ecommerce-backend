// shop/sope.schema.ts

import { z } from "zod";

export const createReviewSchema = z.object({
  body: {
    comment: z.string(),
    userId: z.cuid(),
    productId: z.cuid(),
    rating: z.number(),
    isActive: z.boolean(),
  },
});

export const updateReviewSchema = z.object({
  body: {
    id: z.cuid(),
    comment: z.string(),
    userId: z.cuid(),
    productId: z.cuid(),
    rating: z.number(),
    isActive: z.boolean(),
  },
});
