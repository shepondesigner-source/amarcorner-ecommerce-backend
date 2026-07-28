import { z } from "zod";

export const createLongSizeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(20),
  }),
});

export const updateLongSizeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(20),
  }),
  params: z.object({
    id: z.string(),
  }),
});
