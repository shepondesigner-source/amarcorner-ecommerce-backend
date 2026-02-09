import { z } from "zod";
import { OrderStatus, PaymentStatus } from "../../../generated/prisma";

export const createOrderSchema = z.object({
  body: z.object({
    deliveryCharge: z.number().min(0),
    payment: z.object({
      method: z.enum(["COD", "BKASH"]),
      txId: z.string().optional(),
      amount: z.number(),
      bkashNumber: z.string().optional(),
    }),
    items: z
      .array(
        z.object({
          productId: z.string(),
          imageUrl: z.string(),
          sizeId: z.string().optional(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
});
export const getOrderListSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
export const updateOrderSchema = z.object({
  params: z.object({
    id: z.cuid(), // Order ID from URL
  }),
  body: z.object({
    status: z.enum(OrderStatus).optional(),
    deliveryCharge: z.number().optional(),
    paymentStatus: z.enum(PaymentStatus).optional(),
  }),
});
