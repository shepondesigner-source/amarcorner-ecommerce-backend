import { image } from "pdfkit";
import { z } from "zod";

const id = z.string().min(1);

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(6),
    email: z.email(),
    address: z.string().optional(),
    ownerId: z.string().optional(),
  }),
});

export const updateShopSchema = z.object({
  params: z.object({
    id,
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(6).optional(),
    email: z.email().optional(),
    address: z.string().optional(),
    ownerId: id,
    emailVerified: z.boolean().optional(),
    imageUrl: z.string().optional(),
  }),
});

export const getShopsSchema = z.object({
  query: z.object({
    ownerId: id.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const deleteShopSchema = z.object({
  params: z.object({
    id,
  }),
});
