import { z } from "zod";

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    isActive: z.coerce.boolean().default(true),
    order: z.coerce.number().int().nonnegative(),
  }),
});

export const updateBannerSchema = z.object({
  params: z.object({
    id: z.cuid(),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    slug: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    order: z.coerce.number().int().nonnegative(),
  }),
});
