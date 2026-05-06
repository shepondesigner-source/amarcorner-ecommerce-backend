import { z } from "zod";

export const createComplainSchema = z.object({
  body: {
    email: z.email(),
    name: z.string().min(1),
    phone: z.string().min(1),
    message: z.string().min(1),
  },
});
