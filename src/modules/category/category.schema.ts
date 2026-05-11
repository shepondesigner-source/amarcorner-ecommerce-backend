import { z } from "zod";

const sortOrderField = z
  .preprocess((val) => (val !== undefined ? Number(val) : 1), z.number().int().min(1))
  .optional();

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    isActive: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
    sortOrder: sortOrderField,
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    isActive: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
    sortOrder: sortOrderField,
  }),
  params: z.object({
    id: z.string(),
  }),
});
