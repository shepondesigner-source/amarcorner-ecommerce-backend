import { z } from "zod";
import { Role } from "../../../generated/prisma";

/* ---------- Helpers ---------- */
const id = z.cuid();

/* ---------- Create ---------- */
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(3),

    description: z.string().min(2),
    price: z.coerce.number().positive(),
    shopPrice: z.coerce.number().positive(),
    shopSellPrice: z.coerce.number().positive(),
    stock: z.coerce.number().int().nonnegative().optional(),
    keywords: z.string().optional(),
    categoryId: id,

    shopId: id,
    subCategoryId: id.optional(),
    discountPrice: z.coerce.number().positive().optional(),
    sizeIds: z
      .union([z.string(), z.array(id)])
      .optional()
      .transform((v) => (typeof v === "string" ? JSON.parse(v) : v)),
  }),
});

export const createVendorProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(2),
    shopPrice: z.coerce.number().positive(),
    shopSellPrice: z.coerce.number().positive(),
    stock: z.coerce.number().int().nonnegative().optional(),
    categoryId: id,
    shopId: id,

    subCategoryId: id.optional(),
    sizeIds: z
      .union([z.string(), z.array(id)])
      .optional()
      .transform((v) => (typeof v === "string" ? JSON.parse(v) : v)),
  }),
});

/* ---------- Update ---------- */
export const updateProductSchema = z.object({
  params: z.object({
    id,
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    price: z.coerce.number().positive().optional(),
    discountPrice: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    keywords: z.string().optional(),
    slug: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    existingImageUrls: z
      .string()
      .optional()
      .transform((v) => (v ? JSON.parse(v) : []))
      .refine((v) => Array.isArray(v), {
        message: "existingImageUrls must be an array",
      }),
    categoryId: id.optional(),
    subCategoryId: id.optional(),
    sizeIds: z
      .union([z.string(), z.array(id)])
      .optional()
      .transform((v) => (typeof v === "string" ? JSON.parse(v) : v)),
  }),
});

/* ---------- Pagination ---------- */
export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    shopId: id.optional(),
    categoryId: id.optional(),
    isActive: z.enum(["true", "false"]).optional(),
  }),
});

/* ---------- Delete ---------- */
export const deleteProductSchema = z.object({
  params: z.object({
    id,
  }),
});

export const productFilterSchema = z.object({
  q: z.string().optional(),

  shopId: z.string().optional(),
  ownerId: z.string().optional(),

  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),

  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  discountOnly: z.coerce.boolean().optional(),

  sizeIds: z.array(z.string()).optional(),

  isActive: z.coerce.boolean().optional(),

  sortBy: z.enum(["price", "createdAt", "sold", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(10),
});
