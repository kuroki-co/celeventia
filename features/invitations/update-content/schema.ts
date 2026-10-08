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

const optionalDateOrYear = optionalText.refine(
  (value) => !value || isRealDate(value) || /^\d{4}$/.test(value),
  "Ingresa una fecha valida o un ano de cuatro digitos.",
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

const itineraryIconKeys = [
  "heart",
  "mapPin",
  "utensils",
  "music",
  "sparkles",
  "camera",
] as const;

export const itineraryIconKeySchema = z.enum(itineraryIconKeys);

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
  extraKind: optionalText,
  extraName: optionalText,
  extraTime: optionalTime,
  extraAddress: optionalText,
  extraMapUrl: optionalUrl,
});

export const updateSimpleContentSchema = z.object({
  eventId: z.string().uuid(),
  tagline: optionalText,
  rsvpDeadline: optionalDate,
  closingMessage: optionalText,
  dressCodeStyle: optionalText,
  dressCodeRecommendations: optionalText,
  dressCodeMen: optionalText,
  dressCodeWomen: optionalText,
  dressCodeChildren: optionalText,
  dressCodeAvoidColors: optionalText.refine(
    (value) => !value || parseAvoidColorsText(value).every(isValidAvoidColor),
    "Usa colores como Rojo #8F1D2C, uno por linea.",
  ),
  giftMessage: optionalText,
  yapeOwner: optionalText,
  yapePhone: optionalText,
  plinOwner: optionalText,
  plinPhone: optionalText,
  bankOwner: optionalText,
  bankName: optionalText,
  bankAccountType: optionalText,
  bankCurrency: optionalText,
  bankAccountNumber: optionalText,
  bankCci: optionalText,
  registryUrl: optionalUrl,
  registryLabel: optionalText,
  registryDescription: optionalText,
  musicEnabled: z.coerce.boolean().optional(),
  musicTitle: optionalText,
  musicArtist: optionalText,
  musicVolume: z.coerce.number().min(0).max(1).optional(),
  songSuggestionsEnabled: z.coerce.boolean().optional(),
  songSuggestionsTitle: optionalText,
  songSuggestionsDescription: optionalText,
  collaborativeAlbumEnabled: z.coerce.boolean().optional(),
  collaborativeAlbumTitle: optionalText,
  collaborativeAlbumDescription: optionalText,
});

const familyNamesSchema = z
  .array(optionalText)
  .max(12, "Cada grupo admite hasta 12 nombres.")
  .transform((items) => items.filter((item): item is string => Boolean(item)));

export const updateFamilySchema = z.object({
  eventId: z.string().uuid(),
  intro: optionalText,
  partnerOneFamily: familyNamesSchema,
  partnerTwoFamily: familyNamesSchema,
  godparents: familyNamesSchema,
  witnesses: familyNamesSchema,
});

export const updateItinerarySchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        id: optionalText,
        time: optionalTime,
        title: optionalText,
        description: optionalText,
        iconKey: z
          .union([itineraryIconKeySchema, z.literal("")])
          .optional()
          .transform((value) => (value === "" ? undefined : value)),
        dayOffset: z.coerce.number().int().min(0).max(3).optional(),
        order: z.coerce.number().int().min(0).max(99),
      }),
    )
    .max(10, "El programa admite hasta 10 momentos."),
});

export const updateStorySchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        id: optionalText,
        dateOrYear: optionalDateOrYear,
        title: optionalText,
        description: optionalText,
        order: z.coerce.number().int().min(0).max(99),
      }),
    )
    .max(5, "La historia admite hasta 5 momentos."),
});

export type ItineraryIconKey = z.infer<typeof itineraryIconKeySchema>;

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

function parseAvoidColorsText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(.*?)(#[0-9a-fA-F]{6})$/.exec(line);

      return {
        name: (match?.[1] ?? line).trim(),
        value: match?.[2] ?? "",
      };
    });
}

function isValidAvoidColor(color: { name: string; value: string }) {
  return Boolean(color.name) && /^#[0-9a-fA-F]{6}$/.test(color.value);
}
