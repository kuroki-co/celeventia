"use server";

import { revalidatePath } from "next/cache";

import {
  formatCoupleName,
  formatDateLabel,
  getRequiredPersonalInvitationEvent,
} from "@/features/invitations/get-personal-invitation/data";
import type { WeddingInvitationContent } from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/server";

import {
  updateFamilySchema,
  updateLocationsSchema,
  updateItinerarySchema,
  updateSimpleContentSchema,
  updateStorySchema,
  updateWeddingDetailsSchema,
} from "./schema";

export type UpdateContentState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  formKey?: string;
  success?: string;
  values?: Record<string, boolean | string | undefined>;
};

export async function updateWeddingDetails(
  _prevState: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const values = {
    city: getStringValue(formData, "city"),
    eventDate: getStringValue(formData, "eventDate"),
    eventId: getStringValue(formData, "eventId"),
    eventTimezone: getStringValue(formData, "eventTimezone") || "America/Lima",
    mainInvitationMessage: getStringValue(formData, "mainInvitationMessage"),
    nameOrder: getStringValue(formData, "nameOrder"),
    partnerOneName: getStringValue(formData, "partnerOneName"),
    partnerTwoName: getStringValue(formData, "partnerTwoName"),
  };
  const parsed = updateWeddingDetailsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
      fieldErrors: getFieldErrors(parsed.error),
      formKey: createFormKey(),
      values,
    };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return {
      error: "No pudimos confirmar el evento autorizado.",
      formKey: createFormKey(),
      values,
    };
  }

  const coupleName = formatCoupleName(parsed.data);
  const dateLabel =
    formatDateLabel(parsed.data.eventDate) ?? "Fecha por definir";
  const content = syncContentDate(
    event.content,
    dateLabel,
    parsed.data.eventDate ?? null,
  );

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      city: parsed.data.city || null,
      invitation_content: content,
      couple_name: coupleName,
      draft_revision: event.draftRevision + 1,
      event_date: parsed.data.eventDate || null,
      event_date_label: dateLabel,
      event_timezone: parsed.data.eventTimezone,
      main_invitation_message: parsed.data.mainInvitationMessage || null,
      name_order: parsed.data.nameOrder,
      partner_one_name: parsed.data.partnerOneName,
      partner_two_name: parsed.data.partnerTwoName,
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (error || !updatedEvent) {
    return {
      error: error
        ? "No pudimos guardar los datos."
        : "Hay cambios más recientes. Recarga la página antes de volver a guardar.",
      formKey: createFormKey(),
      values,
    };
  }

  revalidateEditor(event.slug);
  return { formKey: createFormKey(), success: "Guardado en tu borrador.", values };
}

export async function updateLocations(
  _prevState: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const values = {
    ceremonyAddress: getStringValue(formData, "ceremonyAddress"),
    ceremonyEnabled: true,
    ceremonyMapUrl: getStringValue(formData, "ceremonyMapUrl"),
    ceremonyName: getStringValue(formData, "ceremonyName"),
    ceremonyTime: getStringValue(formData, "ceremonyTime"),
    eventId: getStringValue(formData, "eventId"),
    receptionAddress: getStringValue(formData, "receptionAddress"),
    receptionEnabled: true,
    receptionMapUrl: getStringValue(formData, "receptionMapUrl"),
    receptionName: getStringValue(formData, "receptionName"),
    receptionTime: getStringValue(formData, "receptionTime"),
    extraAddress: getStringValue(formData, "extraAddress"),
    extraKind: getStringValue(formData, "extraKind"),
    extraMapUrl: getStringValue(formData, "extraMapUrl"),
    extraName: getStringValue(formData, "extraName"),
    extraTime: getStringValue(formData, "extraTime"),
  };
  const parsed = updateLocationsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los lugares.",
      fieldErrors: getFieldErrors(parsed.error),
      formKey: createFormKey(),
      values,
    };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return {
      error: "No pudimos confirmar el evento autorizado.",
      formKey: createFormKey(),
      values,
    };
  }

  const currentCeremony = event.content.locations?.find(
    (location) => location.kind === "Ceremonia",
  );
  const currentReception = event.content.locations?.find(
    (location) => location.kind === "Recepcion",
  );
  const currentExtra = event.content.locations?.find(
    (location) =>
      location.kind !== "Ceremonia" && location.kind !== "Recepcion",
  );
  const locations: WeddingInvitationContent["locations"] = [
    {
      address: parsed.data.ceremonyAddress || undefined,
      date: event.dateLabel,
      enabled: hasLocationContent({
        address: parsed.data.ceremonyAddress,
        mapUrl: parsed.data.ceremonyMapUrl,
        name: parsed.data.ceremonyName,
        time: parsed.data.ceremonyTime,
      }),
      kind: "Ceremonia",
      image: currentCeremony?.image,
      mapUrl: parsed.data.ceremonyMapUrl || undefined,
      name: parsed.data.ceremonyName || "",
      time: parsed.data.ceremonyTime || undefined,
    },
    {
      address: parsed.data.receptionAddress || undefined,
      date: event.dateLabel,
      enabled: hasLocationContent({
        address: parsed.data.receptionAddress,
        mapUrl: parsed.data.receptionMapUrl,
        name: parsed.data.receptionName,
        time: parsed.data.receptionTime,
      }),
      kind: "Recepcion",
      image: currentReception?.image,
      mapUrl: parsed.data.receptionMapUrl || undefined,
      name: parsed.data.receptionName || "",
      time: parsed.data.receptionTime || undefined,
    },
  ];

  if (
    hasLocationContent({
      address: parsed.data.extraAddress,
      mapUrl: parsed.data.extraMapUrl,
      name: parsed.data.extraName,
      time: parsed.data.extraTime,
    })
  ) {
    locations.push({
      address: parsed.data.extraAddress || undefined,
      date: event.dateLabel,
      enabled: true,
      image: currentExtra?.image,
      kind: parsed.data.extraKind || currentExtra?.kind || "Lugar adicional",
      mapUrl: parsed.data.extraMapUrl || undefined,
      name: parsed.data.extraName || "",
      time: parsed.data.extraTime || undefined,
    });
  }

  const content = {
    ...event.content,
    locations,
    saveTheDate: buildSaveTheDate(
      event.eventDate,
      event.content.saveTheDate,
    ),
  };

  const firstLocation = locations.find((location) => location.enabled);
  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: content,
      main_location_name: firstLocation?.name || null,
      main_location_time: firstLocation?.time || null,
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (error || !updatedEvent) {
    return {
      error: error
        ? "No pudimos guardar los lugares."
        : "Hay cambios más recientes. Recarga la página antes de volver a guardar.",
      formKey: createFormKey(),
      values,
    };
  }

  revalidateEditor(event.slug);
  return { formKey: createFormKey(), success: "Guardado en tu borrador.", values };
}

export async function updateSimpleContent(
  _prevState: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const values = {
    closingMessage: getStringValue(formData, "closingMessage"),
    rsvpDeadline: getStringValue(formData, "rsvpDeadline"),
    dressCodeRecommendations: getStringValue(
      formData,
      "dressCodeRecommendations",
    ),
    dressCodeAvoidColors: getStringValue(formData, "dressCodeAvoidColors"),
    dressCodeChildren: getStringValue(formData, "dressCodeChildren"),
    dressCodeMen: getStringValue(formData, "dressCodeMen"),
    dressCodeStyle: getStringValue(formData, "dressCodeStyle"),
    dressCodeWomen: getStringValue(formData, "dressCodeWomen"),
    eventId: getStringValue(formData, "eventId"),
    giftMessage: getStringValue(formData, "giftMessage"),
    yapeOwner: getStringValue(formData, "yapeOwner"),
    yapePhone: getStringValue(formData, "yapePhone"),
    plinOwner: getStringValue(formData, "plinOwner"),
    plinPhone: getStringValue(formData, "plinPhone"),
    bankOwner: getStringValue(formData, "bankOwner"),
    bankName: getStringValue(formData, "bankName"),
    bankAccountType: getStringValue(formData, "bankAccountType"),
    bankCurrency: getStringValue(formData, "bankCurrency"),
    bankAccountNumber: getStringValue(formData, "bankAccountNumber"),
    bankCci: getStringValue(formData, "bankCci"),
    registryUrl: getStringValue(formData, "registryUrl"),
    registryLabel: getStringValue(formData, "registryLabel"),
    registryDescription: getStringValue(formData, "registryDescription"),
    musicArtist: getStringValue(formData, "musicArtist"),
    musicEnabled: formData.get("musicEnabled") === "on",
    musicTitle: getStringValue(formData, "musicTitle"),
    musicVolume: getStringValue(formData, "musicVolume") || undefined,
    songSuggestionsDescription: getStringValue(
      formData,
      "songSuggestionsDescription",
    ),
    songSuggestionsEnabled: formData.get("songSuggestionsEnabled") === "on",
    songSuggestionsTitle: getStringValue(formData, "songSuggestionsTitle"),
    collaborativeAlbumDescription: getStringValue(
      formData,
      "collaborativeAlbumDescription",
    ),
    collaborativeAlbumEnabled:
      formData.get("collaborativeAlbumEnabled") === "on",
    collaborativeAlbumTitle: getStringValue(formData, "collaborativeAlbumTitle"),
    tagline: getStringValue(formData, "tagline"),
  };
  const parsed = updateSimpleContentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa el contenido.",
      fieldErrors: getFieldErrors(parsed.error),
      formKey: createFormKey(),
      values,
    };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return {
      error: "No pudimos confirmar el evento autorizado.",
      formKey: createFormKey(),
      values,
    };
  }

  const content: WeddingInvitationContent = { ...event.content };

  if (Object.hasOwn(values, "tagline")) {
    content.tagline = parsed.data.tagline || null;
  }

  if (
    Object.hasOwn(values, "dressCodeStyle") ||
    Object.hasOwn(values, "dressCodeRecommendations") ||
    Object.hasOwn(values, "dressCodeMen") ||
    Object.hasOwn(values, "dressCodeWomen") ||
    Object.hasOwn(values, "dressCodeChildren") ||
    Object.hasOwn(values, "dressCodeAvoidColors")
  ) {
    const avoidColors = parseAvoidColorsText(
      parsed.data.dressCodeAvoidColors ?? "",
    );
    content.dressCode =
      parsed.data.dressCodeStyle ||
      parsed.data.dressCodeRecommendations ||
      parsed.data.dressCodeMen ||
      parsed.data.dressCodeWomen ||
      parsed.data.dressCodeChildren ||
      avoidColors.length
        ? {
            ...event.content.dressCode,
            style:
              parsed.data.dressCodeStyle ??
              event.content.dressCode?.style,
            general:
              parsed.data.dressCodeRecommendations ??
              event.content.dressCode?.general,
            men: parsed.data.dressCodeMen ?? event.content.dressCode?.men,
            women:
              parsed.data.dressCodeWomen ?? event.content.dressCode?.women,
            children:
              parsed.data.dressCodeChildren ??
              event.content.dressCode?.children,
            avoidColors,
          }
        : null;
  }

  if (Object.hasOwn(values, "giftMessage")) {
    content.gifts = buildGiftMethods(event.content.gifts, parsed.data);
  }

  if (Object.hasOwn(values, "closingMessage")) {
    content.closingMessage = parsed.data.closingMessage || null;
  }

  if (Object.hasOwn(values, "musicEnabled")) {
    const currentMusic = event.content.music;
    const hasStoredAudio = Boolean(currentMusic?.audio || currentMusic?.audioUrl);

    if (parsed.data.musicEnabled && !hasStoredAudio) {
      return {
        error: "Sube un archivo MP3 antes de activar la musica.",
        fieldErrors: {
          musicAudioFile: "Sube un archivo MP3 antes de activar la musica.",
        },
        formKey: createFormKey(),
        values,
      };
    }

    content.music =
      parsed.data.musicEnabled
        ? {
            artist: parsed.data.musicArtist,
            ...(currentMusic?.audio ? { audio: currentMusic.audio } : {}),
            ...(!currentMusic?.audio && currentMusic?.audioUrl
              ? { audioUrl: currentMusic.audioUrl }
              : {}),
            enabled: true,
            title: parsed.data.musicTitle,
            volume:
              typeof parsed.data.musicVolume === "number"
                ? parsed.data.musicVolume
                : 0.45,
          }
        : null;
  }

  if (Object.hasOwn(values, "songSuggestionsEnabled")) {
    content.songSuggestions = parsed.data.songSuggestionsEnabled
      ? {
          description: parsed.data.songSuggestionsDescription,
          enabled: true,
          title: parsed.data.songSuggestionsTitle,
        }
      : null;
  }

  if (Object.hasOwn(values, "collaborativeAlbumEnabled")) {
    content.collaborativeAlbum = parsed.data.collaborativeAlbumEnabled
      ? {
          description: parsed.data.collaborativeAlbumDescription,
          enabled: true,
          title: parsed.data.collaborativeAlbumTitle,
        }
      : null;
  }

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: content,
      rsvp_deadline: parsed.data.rsvpDeadline || null,
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (error || !updatedEvent) {
    return {
      error: error
        ? "No pudimos guardar el contenido."
        : "Hay cambios más recientes. Recarga la página antes de volver a guardar.",
      formKey: createFormKey(),
      values,
    };
  }

  revalidateEditor(event.slug);
  return { formKey: createFormKey(), success: "Guardado en tu borrador.", values };
}

export async function updateFamily(
  _prevState: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const values = {
    eventId: getStringValue(formData, "eventId"),
    intro: getStringValue(formData, "familyIntro"),
    partnerOneFamily: getStringValues(formData, "partnerOneFamily"),
    partnerTwoFamily: getStringValues(formData, "partnerTwoFamily"),
    godparents: getStringValues(formData, "godparents"),
    witnesses: getStringValues(formData, "witnesses"),
  };
  const parsed = updateFamilySchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa la familia.",
      fieldErrors: getFieldErrors(parsed.error),
      formKey: createFormKey(),
      values: { eventId: values.eventId },
    };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return {
      error: "No pudimos confirmar el evento autorizado.",
      formKey: createFormKey(),
      values: { eventId: values.eventId },
    };
  }

  const hasFamilyContent = Boolean(
    parsed.data.intro ||
      parsed.data.partnerOneFamily.length ||
      parsed.data.partnerTwoFamily.length ||
      parsed.data.godparents.length ||
      parsed.data.witnesses.length,
  );
  const content: WeddingInvitationContent = {
    ...event.content,
    family: hasFamilyContent
      ? {
          ...(parsed.data.intro ? { intro: parsed.data.intro } : {}),
          groomParents: parsed.data.partnerOneFamily,
          brideParents: parsed.data.partnerTwoFamily,
          godparents: parsed.data.godparents,
          witnesses: parsed.data.witnesses,
        }
      : null,
  };

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: content,
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (error || !updatedEvent) {
    return {
      error: error
        ? "No pudimos guardar la familia."
        : "Hay cambios mas recientes. Recarga la pagina antes de volver a guardar.",
      formKey: createFormKey(),
      values: { eventId: values.eventId },
    };
  }

  revalidateEditor(event.slug);
  return {
    formKey: createFormKey(),
    success: "Familia guardada en tu borrador.",
    values: { eventId: values.eventId },
  };
}

export async function updateItinerary(
  _prevState: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const eventId = getStringValue(formData, "eventId");
  const ids = getStringValues(formData, "itineraryId");
  const times = getStringValues(formData, "itineraryTime");
  const titles = getStringValues(formData, "itineraryTitle");
  const descriptions = getStringValues(formData, "itineraryDescription");
  const iconKeys = getStringValues(formData, "itineraryIconKey");
  const dayOffsets = getStringValues(formData, "itineraryDayOffset");
  const items = titles.map((title, index) => ({
    id: ids[index],
    time: times[index],
    title,
    description: descriptions[index],
    iconKey: iconKeys[index],
    dayOffset: dayOffsets[index] || 0,
    order: index,
  }));
  const values = {
    eventId,
    items,
  };
  const parsed = updateItinerarySchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa el programa.",
      fieldErrors: getFieldErrors(parsed.error),
      formKey: createFormKey(),
      values: { eventId },
    };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return {
      error: "No pudimos confirmar el evento autorizado.",
      formKey: createFormKey(),
      values: { eventId },
    };
  }

  const itinerary = parsed.data.items
    .filter((item) => item.title || item.time || item.description)
    .map((item, index) => ({
      ...(item.id ? { id: item.id } : { id: crypto.randomUUID() }),
      ...(item.time ? { time: item.time } : {}),
      ...(item.description ? { description: item.description } : {}),
      ...(item.iconKey ? { iconKey: item.iconKey } : {}),
      ...(item.dayOffset ? { dayOffset: item.dayOffset } : {}),
      order: index,
      title: item.title || "Momento sin titulo",
    }));
  const content: WeddingInvitationContent = {
    ...event.content,
    itinerary,
  };

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: content,
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (error || !updatedEvent) {
    return {
      error: error
        ? "No pudimos guardar el programa."
        : "Hay cambios mÃ¡s recientes. Recarga la pÃ¡gina antes de volver a guardar.",
      formKey: createFormKey(),
      values: { eventId },
    };
  }

  revalidateEditor(event.slug);
  return {
    formKey: createFormKey(),
    success: "Programa guardado en tu borrador.",
    values: { eventId },
  };
}

export async function updateStory(
  _prevState: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const eventId = getStringValue(formData, "eventId");
  const ids = getStringValues(formData, "storyId");
  const dates = getStringValues(formData, "storyDateOrYear");
  const titles = getStringValues(formData, "storyTitle");
  const descriptions = getStringValues(formData, "storyDescription");
  const items = titles.map((title, index) => ({
    id: ids[index],
    dateOrYear: dates[index],
    title,
    description: descriptions[index],
    order: index,
  }));
  const values = {
    eventId,
    items,
  };
  const parsed = updateStorySchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa la historia.",
      fieldErrors: getFieldErrors(parsed.error),
      formKey: createFormKey(),
      values: { eventId },
    };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return {
      error: "No pudimos confirmar el evento autorizado.",
      formKey: createFormKey(),
      values: { eventId },
    };
  }

  const existingById = new Map(
    (event.content.story ?? [])
      .filter((item) => item.id)
      .map((item) => [item.id, item]),
  );
  const story = parsed.data.items
    .filter((item) => item.title || item.dateOrYear || item.description)
    .map((item, index) => {
      const id = item.id || crypto.randomUUID();
      const existing = existingById.get(id);
      const hasFullDate = item.dateOrYear
        ? /^\d{4}-\d{2}-\d{2}$/.test(item.dateOrYear)
        : false;

      return {
        ...(existing?.image ? { image: existing.image } : {}),
        ...(existing?.imageAlt ? { imageAlt: existing.imageAlt } : {}),
        ...(existing?.imageUrl ? { imageUrl: existing.imageUrl } : {}),
        ...(hasFullDate
          ? { date: item.dateOrYear }
          : item.dateOrYear
            ? { year: item.dateOrYear }
            : {}),
        ...(item.description ? { description: item.description } : {}),
        id,
        order: index,
        title: item.title || "Momento sin titulo",
      };
    });
  const content: WeddingInvitationContent = {
    ...event.content,
    story,
  };

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: content,
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (error || !updatedEvent) {
    return {
      error: error
        ? "No pudimos guardar la historia."
        : "Hay cambios mas recientes. Recarga la pagina antes de volver a guardar.",
      formKey: createFormKey(),
      values: { eventId },
    };
  }

  revalidateEditor(event.slug);
  return {
    formKey: createFormKey(),
    success: "Historia guardada en tu borrador.",
    values: { eventId },
  };
}

function syncContentDate(
  content: WeddingInvitationContent,
  dateLabel: string,
  eventDate: string | null,
): WeddingInvitationContent {
  return {
    ...content,
    locations: content.locations?.map((location) => ({
      ...location,
      date: dateLabel,
    })),
    saveTheDate: buildSaveTheDate(eventDate, content.saveTheDate),
  };
}

function buildSaveTheDate(
  value: string | null,
  existing?: WeddingInvitationContent["saveTheDate"],
) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    day: new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      timeZone: "UTC",
    }).format(date),
    month: new Intl.DateTimeFormat("es-PE", {
      month: "long",
      timeZone: "UTC",
    }).format(date),
    weekday: new Intl.DateTimeFormat("es-PE", {
      timeZone: "UTC",
      weekday: "long",
    }).format(date),
    ...(existing?.message ? { message: existing.message } : {}),
  };
}

function revalidateEditor(slug: string) {
  revalidatePath("/admin/personal");
  revalidatePath("/admin/personal/invitacion/datos");
  revalidatePath("/admin/personal/invitacion/contenido");
  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/preview");
  revalidatePath("/admin/personal/invitacion/publicar");
  revalidatePath(`/i/${slug}`);
}

function createFormKey() {
  return crypto.randomUUID();
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function getStringValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value : undefined));
}

function getFieldErrors(error: {
  issues: Array<{ message: string; path: Array<PropertyKey> }>;
}) {
  return error.issues.reduce<Record<string, string>>((errors, issue) => {
    const [field] = issue.path;

    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}

function hasLocationContent(location: {
  address?: string;
  mapUrl?: string;
  name?: string;
  time?: string;
}) {
  return Boolean(
    location.address?.trim() ||
      location.mapUrl?.trim() ||
      location.name?.trim() ||
      location.time?.trim(),
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
    })
    .filter((color) => color.name && /^#[0-9a-fA-F]{6}$/.test(color.value));
}

function buildGiftMethods(
  existingGifts: WeddingInvitationContent["gifts"] = [],
  data: {
    giftMessage?: string;
    yapeOwner?: string;
    yapePhone?: string;
    plinOwner?: string;
    plinPhone?: string;
    bankOwner?: string;
    bankName?: string;
    bankAccountType?: string;
    bankCurrency?: string;
    bankAccountNumber?: string;
    bankCci?: string;
    registryUrl?: string;
    registryLabel?: string;
    registryDescription?: string;
  },
): WeddingInvitationContent["gifts"] {
  const knownKinds = new Set([
    "envelope",
    "yape",
    "plin",
    "bankTransfer",
    "externalRegistry",
  ]);
  const preservedUnknown = existingGifts.filter(
    (gift) => !gift.kind || !knownKinds.has(gift.kind),
  );
  const gifts: NonNullable<WeddingInvitationContent["gifts"]> = [
    ...preservedUnknown,
  ];

  if (data.giftMessage) {
    gifts.push({
      description: data.giftMessage,
      enabled: true,
      kind: "envelope",
      title: "Sobre de regalos",
    });
  }

  if (data.yapeOwner || data.yapePhone) {
    gifts.push({
      description: "Yape",
      enabled: true,
      kind: "yape",
      owner: data.yapeOwner,
      phone: data.yapePhone,
      title: "Yape",
    });
  }

  if (data.plinOwner || data.plinPhone) {
    gifts.push({
      description: "Plin",
      enabled: true,
      kind: "plin",
      owner: data.plinOwner,
      phone: data.plinPhone,
      title: "Plin",
    });
  }

  if (
    data.bankOwner ||
    data.bankName ||
    data.bankAccountType ||
    data.bankCurrency ||
    data.bankAccountNumber ||
    data.bankCci
  ) {
    gifts.push({
      accountNumber: data.bankAccountNumber,
      accountType: data.bankAccountType,
      bank: data.bankName,
      cci: data.bankCci,
      currency: data.bankCurrency,
      description: data.bankOwner ?? "Transferencia bancaria",
      enabled: true,
      kind: "bankTransfer",
      owner: data.bankOwner,
      title: "Transferencia bancaria",
    });
  }

  if (data.registryUrl || data.registryLabel || data.registryDescription) {
    gifts.push({
      description: data.registryDescription ?? "Lista de regalos",
      enabled: Boolean(data.registryUrl),
      kind: "externalRegistry",
      linkLabel: data.registryLabel,
      title: data.registryLabel ?? "Lista de regalos",
      url: data.registryUrl,
    });
  }

  return gifts;
}
