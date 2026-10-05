import { z } from "zod";

const optionalText = z.string().trim().optional();

export const updateWeddingDetailsSchema = z.object({
  eventId: z.string().uuid(),
  partnerOneName: z.string().trim().min(1, "Ingresa el primer nombre."),
  partnerTwoName: z.string().trim().min(1, "Ingresa el segundo nombre."),
  nameOrder: z.enum(["partner_one_first", "partner_two_first"]),
  eventDate: optionalText,
  eventTimezone: z.string().trim().min(1),
  city: optionalText,
  mainInvitationMessage: optionalText,
});

export const updateLocationsSchema = z.object({
  eventId: z.string().uuid(),
  ceremonyEnabled: z.coerce.boolean().optional(),
  ceremonyName: optionalText,
  ceremonyTime: optionalText,
  ceremonyAddress: optionalText,
  ceremonyMapUrl: optionalText,
  receptionEnabled: z.coerce.boolean().optional(),
  receptionName: optionalText,
  receptionTime: optionalText,
  receptionAddress: optionalText,
  receptionMapUrl: optionalText,
});

export const updateSimpleContentSchema = z.object({
  eventId: z.string().uuid(),
  tagline: optionalText,
  closingMessage: optionalText,
  dressCodeStyle: optionalText,
  dressCodeRecommendations: optionalText,
  giftMessage: optionalText,
});
