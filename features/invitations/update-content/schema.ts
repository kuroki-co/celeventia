import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const optionalDate = optionalText.refine(
  (value) => !value || isRealDate(value),
  "Ingresa una fecha válida.",
);

const optionalTime = optionalText.refine(
  (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
  "Ingresa una hora válida.",
);

const optionalUrl = optionalText.refine((value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}, "Pega un enlace que empiece con http:// o https://.");

export const updateWeddingDetailsSchema = z.object({
  eventId: z.string().uuid(),
  partnerOneName: z.string().trim().min(1, "Ingresa el primer nombre."),
  partnerTwoName: z.string().trim().min(1, "Ingresa el segundo nombre."),
  nameOrder: z.enum(["partner_one_first", "partner_two_first"]),
  eventDate: optionalDate,
  eventTimezone: z
    .enum(["America/Lima"], {
      message: "Selecciona una zona horaria válida.",
    })
    .default("America/Lima"),
  city: optionalText,
  mainInvitationMessage: optionalText,
});

export const updateLocationsSchema = z.object({
  eventId: z.string().uuid(),
  ceremonyEnabled: z.coerce.boolean().optional(),
  ceremonyName: optionalText,
  ceremonyTime: optionalTime,
  ceremonyAddress: optionalText,
  ceremonyMapUrl: optionalUrl,
  receptionEnabled: z.coerce.boolean().optional(),
  receptionName: optionalText,
  receptionTime: optionalTime,
  receptionAddress: optionalText,
  receptionMapUrl: optionalUrl,
});

export const updateSimpleContentSchema = z.object({
  eventId: z.string().uuid(),
  tagline: optionalText,
  closingMessage: optionalText,
  dressCodeStyle: optionalText,
  dressCodeRecommendations: optionalText,
  giftMessage: optionalText,
});

function isRealDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
