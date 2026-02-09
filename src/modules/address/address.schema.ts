import { z } from "zod";

export const createAddressSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    district: z.string().min(2),
    address: z.string().min(5),
    isDefault: z.boolean(),
  }),
});
export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(8).optional(),
    district: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    isDefault: z.boolean(),
  }),
});
export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
