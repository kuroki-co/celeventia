import { z } from "zod";

export const submitRsvpSchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(16),
  response: z.enum(["confirmed", "declined"]),
  attendeeCount: z.coerce.number().int().min(0).max(20),
  attendeeNames: z.array(z.string().trim().max(120)).default([]),
});
