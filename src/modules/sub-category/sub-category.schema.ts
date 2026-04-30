import { z } from "zod";

/**
 * CREATE SubCategory
 */
export const createSubCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    categoryId: z.string("Invalid category id"),
    isActive: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
  }),
});

/**
 * UPDATE SubCategory
 */
export const updateSubCategorySchema = z.object({
  params: z.object({
    id: z.string("Invalid sub-category id"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    categoryId: z.string().optional(),
    isActive: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
  }),
});
