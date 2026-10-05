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
  updateLocationsSchema,
  updateSimpleContentSchema,
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

  const { error } = await supabase
    .from("events")
    .update({
      city: parsed.data.city || null,
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
    .eq("id", event.id);

  if (error) {
    return {
      error: "No pudimos guardar los datos.",
      formKey: createFormKey(),
      values,
    };
  }

  revalidateEditor(event.slug);
  return { formKey: createFormKey(), success: "Guardado.", values };
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
      mapUrl: parsed.data.receptionMapUrl || undefined,
      name: parsed.data.receptionName || "",
      time: parsed.data.receptionTime || undefined,
    },
  ];

  const content = {
    ...event.content,
    locations,
    saveTheDate: buildSaveTheDate(event.eventDate),
  };

  const firstLocation = locations.find((location) => location.enabled);
  const { error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: content,
      main_location_name: firstLocation?.name || null,
      main_location_time: firstLocation?.time || null,
    })
    .eq("id", event.id);

  if (error) {
    return {
      error: "No pudimos guardar los lugares.",
      formKey: createFormKey(),
      values,
    };
  }

  revalidateEditor(event.slug);
  return { formKey: createFormKey(), success: "Guardado.", values };
}

export async function updateSimpleContent(
  _prevState: UpdateContentState,
  formData: FormData,
): Promise<UpdateContentState> {
  const values = {
    closingMessage: getStringValue(formData, "closingMessage"),
    dressCodeRecommendations: getStringValue(
      formData,
      "dressCodeRecommendations",
    ),
    dressCodeStyle: getStringValue(formData, "dressCodeStyle"),
    eventId: getStringValue(formData, "eventId"),
    giftMessage: getStringValue(formData, "giftMessage"),
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
    Object.hasOwn(values, "dressCodeRecommendations")
  ) {
    content.dressCode =
      parsed.data.dressCodeStyle || parsed.data.dressCodeRecommendations
        ? {
            ...event.content.dressCode,
            style:
              parsed.data.dressCodeStyle ??
              event.content.dressCode?.style,
            general:
              parsed.data.dressCodeRecommendations ??
              event.content.dressCode?.general,
          }
        : null;
  }

  if (Object.hasOwn(values, "giftMessage")) {
    const existingGifts = event.content.gifts ?? [];
    const envelopeGift = {
      description: parsed.data.giftMessage ?? "",
      enabled: Boolean(parsed.data.giftMessage),
      kind: "envelope" as const,
      title: "Regalos",
    };
    const hasEnvelope = existingGifts.some((gift) => gift.kind === "envelope");

    content.gifts = hasEnvelope
      ? existingGifts.map((gift) =>
          gift.kind === "envelope" ? { ...gift, ...envelopeGift } : gift,
        )
      : parsed.data.giftMessage
        ? [...existingGifts, envelopeGift]
        : existingGifts;
  }

  if (Object.hasOwn(values, "closingMessage")) {
    content.closingMessage = parsed.data.closingMessage || null;
  }

  const { error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: content,
    })
    .eq("id", event.id);

  if (error) {
    return {
      error: "No pudimos guardar el contenido.",
      formKey: createFormKey(),
      values,
    };
  }

  revalidateEditor(event.slug);
  return { formKey: createFormKey(), success: "Guardado.", values };
}

function buildSaveTheDate(value: string | null) {
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
