import { z } from "zod";

export const uploadImageSchema = z.object({
  eventId: z.string().uuid(),
  purpose: z.enum(["invitation", "gallery", "story"]),
});

export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
export const maxImageSizeBytes = 5 * 1024 * 1024;
