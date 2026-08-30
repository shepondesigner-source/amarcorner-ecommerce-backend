import { z } from "zod";

export const sendSmsSchema = z.object({
  body: z.object({
    contacts: z.union([
      z.string().min(1),
      z.array(z.string().min(1)).min(1),
    ]),
    message: z.string().min(1),
    type: z.enum(["text", "unicode"]).optional(),
    label: z.enum(["transactional", "promotional"]).optional(),
    scheduledDateTime: z.string().optional(),
  }),
});

export const getDeliveryReportSchema = z.object({
  params: z.object({
    shootId: z.string().optional(),
  }),
});
