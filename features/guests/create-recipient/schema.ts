import { z } from "zod";

export const createRecipientSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Escribe un nombre de invitación.")
    .max(120, "Usa un nombre más corto."),
  phone: z
    .string()
    .trim()
    .max(32, "El teléfono es demasiado largo.")
    .optional(),
  maxGuests: z.coerce
    .number()
    .int("El número de pases debe ser entero.")
    .min(1, "Asigna al menos 1 pase.")
    .max(20, "Para el MVP usa hasta 20 pases por destinatario."),
});

export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;
