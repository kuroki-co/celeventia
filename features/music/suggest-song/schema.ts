import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const suggestSongSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  songTitle: z.string().trim().min(1, "Ingresa el nombre de la cancion.").max(140),
  artist: optionalText.refine(
    (value) => !value || value.length <= 140,
    "El artista debe tener 140 caracteres o menos.",
  ),
  requesterName: z
    .string()
    .trim()
    .min(1, "Ingresa tu nombre.")
    .max(120, "Tu nombre debe tener 120 caracteres o menos."),
});
