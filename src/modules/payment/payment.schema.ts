import { z } from "zod";

export const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.cuid(),
    amount: z.number().positive(),
    method: z.string().min(2),
    txId: z.string().min(5),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.cuid(),
  }),
  body: z.object({
    status: z.enum(["PENDING", "SUCCESS", "FAILED"]),
  }),
});
