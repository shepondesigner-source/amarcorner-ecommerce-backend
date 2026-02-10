// otp.schema.ts
import { z } from "zod";
import { OtpPurpose } from "./otp.type";

export const createOtpSchema = z.object({
  body: z.object({
    email: z.email(),
    purpose: z.enum(OtpPurpose),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.email(),
    code: z.string().length(6),
    purpose: z.enum(OtpPurpose),
  }),
});
