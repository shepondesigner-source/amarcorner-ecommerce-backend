import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    emailVerified:z.boolean(),
    phone: z.string(),
    secondPhone: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(["USER", "ADMIN", "SHOP_OWNER"]).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    secondPhone: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(["USER", "ADMIN", "SHOP_OWNER"]).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});
