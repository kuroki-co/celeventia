import { z } from "zod";

export { allowedImageTypes, maxImageSizeBytes } from "./limits";

export const uploadImageSchema = z.object({
  eventId: z.string().uuid(),
  purpose: z.enum(["invitation", "gallery", "story"]),
});
