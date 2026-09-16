import { z } from "zod";

export const createSteadfastOrderSchema = z.object({
  body: z.object({
    invoice: z
      .string()
      .min(1)
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "invoice must be alpha-numeric, hyphens, or underscores only",
      ),
    recipient_name: z.string().min(1).max(100),
    recipient_phone: z.string().regex(/^\d{11}$/, "must be 11 digits"),
    alternative_phone: z
      .string()
      .regex(/^\d{11}$/, "must be 11 digits")
      .optional(),
    recipient_email: z.string().email().optional(),
    recipient_address: z.string().min(1).max(250),
    cod_amount: z.number().min(0),
    note: z.string().optional(),
    item_description: z.string().optional(),
    total_lot: z.number().int().nonnegative().optional(),
    delivery_type: z.union([z.literal(0), z.literal(1)]).optional(),
  }),
});

export const createSteadfastFromOrderSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    deliveryType: z.union([z.literal(0), z.literal(1)]).optional(),
    note: z.string().optional(),
    itemDescription: z.string().optional(),
    totalLot: z.number().int().nonnegative().optional(),
  }),
});
