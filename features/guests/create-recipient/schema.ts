import { z } from "zod";

import { isValidOptionalPhone } from "./phone";

export const createRecipientSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Escribe un nombre de invitacion.")
    .max(120, "Usa un nombre mas corto."),
  phone: z
    .string()
    .trim()
    .max(32, "El telefono es demasiado largo.")
    .refine(
      isValidOptionalPhone,
      "Usa un celular peruano de 9 digitos o un numero internacional con +.",
    )
    .optional(),
  maxGuests: z.coerce
    .number()
    .int("El numero de pases debe ser entero.")
    .min(1, "Asigna al menos 1 pase.")
    .max(20, "Puedes asignar entre 1 y 20 pases a esta invitacion."),
});

export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;
