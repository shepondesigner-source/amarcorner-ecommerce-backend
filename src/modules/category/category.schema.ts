import { z } from "zod";
import { is } from "zod/v4/locales";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    isActive: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    isActive: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});
