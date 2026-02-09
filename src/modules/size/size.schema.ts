import { z } from "zod";

export const createSizeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(20),
  }),
});

export const updateSizeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(20),
  }),
  params: z.object({
    id: z.string(),
  }),
});
