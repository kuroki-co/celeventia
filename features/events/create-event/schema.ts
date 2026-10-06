import { z } from "zod";

export const createEventSchema = z
  .object({
    partnerOneName: z.string().trim().min(1, "Ingresa el primer nombre."),
    partnerTwoName: z.string().trim().min(1, "Ingresa el segundo nombre."),
    nameOrder: z.enum(["partner_one_first", "partner_two_first"]),
    hasDate: z.enum(["yes", "no"]),
    eventDate: z.string().trim().optional(),
    eventTimezone: z.string().trim().min(1).default("America/Lima"),
    city: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.hasDate === "yes" && !value.eventDate) {
      context.addIssue({
        code: "custom",
        message: "Selecciona la fecha o marca que aún no la tienen.",
        path: ["eventDate"],
      });
    }
  });

export const completeOnboardingSchema = z.object({
  eventId: z.string().uuid(),
});
