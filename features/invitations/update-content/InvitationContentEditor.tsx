"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import type { PersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { InvitationPhotosEditor } from "@/features/media/manage-draft-images/InvitationPhotosEditor";

import {
  updateLocations,
  updateSimpleContent,
  updateWeddingDetails,
  type UpdateContentState,
} from "./action";

type InvitationContentEditorProps = {
  event: PersonalInvitationEvent;
  initialSection?: "datos" | "contenido" | "fotografias";
};

type EditorSectionId = "" | "datos" | "lugares" | "contenido" | "fotografias";
type DirtyStatus = "dirty" | "submitted";

const initialState: UpdateContentState = {};

export function InvitationContentEditor({
  event,
  initialSection = "datos",
}: InvitationContentEditorProps) {
  const [openSection, setOpenSection] =
    useState<EditorSectionId>(initialSection);
  const [detailsState, detailsAction] = useActionState(
    updateWeddingDetails,
    initialState,
  );
  const [locationsState, locationsAction] = useActionState(
    updateLocations,
    initialState,
  );
  const [contentState, contentAction] = useActionState(
    updateSimpleContent,
    initialState,
  );
  const [dirtyForms, setDirtyForms] = useState<Record<string, DirtyStatus>>({});
  const ceremony = event.content.locations?.find(
    (location) => location.kind === "Ceremonia",
  );
  const reception = event.content.locations?.find(
    (location) => location.kind === "Recepcion",
  );
  const detailsValues = detailsState.values;
  const locationsValues = locationsState.values;
  const contentValues = contentState.values;
  const hasUnsavedChanges = useMemo(
    () =>
      dirtyForms.datos === "dirty" ||
      (dirtyForms.datos === "submitted" && Boolean(detailsState.error)) ||
      dirtyForms.lugares === "dirty" ||
      (dirtyForms.lugares === "submitted" && Boolean(locationsState.error)) ||
      dirtyForms.contenido === "dirty" ||
      (dirtyForms.contenido === "submitted" && Boolean(contentState.error)),
    [
      contentState.error,
      detailsState.error,
      dirtyForms,
      locationsState.error,
    ],
  );

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    function protectUnsavedChanges(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", protectUnsavedChanges);

    return () => {
      window.removeEventListener("beforeunload", protectUnsavedChanges);
    };
  }, [hasUnsavedChanges]);

  function markDirty(formId: EditorSectionId) {
    setDirtyForms((current) =>
      current[formId] === "dirty" ? current : { ...current, [formId]: "dirty" },
    );
  }

  function markSubmitted(formId: EditorSectionId) {
    setDirtyForms((current) => ({ ...current, [formId]: "submitted" }));
  }

  return (
    <div className="grid gap-3">
      {hasUnsavedChanges ? (
        <div className="rounded-2xl border border-muted-mauve/20 bg-white px-4 py-3 text-sm font-semibold text-midnight-navy">
          Cambios sin guardar. Guarda antes de salir o recargar la pagina.
        </div>
      ) : null}
      <EditorSection
        id="datos"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Datos de la boda"
      >
        <form
          action={detailsAction}
          className="grid gap-4"
          onInput={() => markDirty("datos")}
          onSubmit={() => markSubmitted("datos")}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              defaultValue={getStringValue(
                detailsValues?.partnerOneName,
                event.partnerOneName,
              )}
              error={detailsState.fieldErrors?.partnerOneName}
              label="Primera persona"
              name="partnerOneName"
              required
            />
            <TextField
              defaultValue={getStringValue(
                detailsValues?.partnerTwoName,
                event.partnerTwoName,
              )}
              error={detailsState.fieldErrors?.partnerTwoName}
              label="Segunda persona"
              name="partnerTwoName"
              required
            />
          </div>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Orden de los nombres
            <select
              className={inputClassName}
              defaultValue={getStringValue(
                detailsValues?.nameOrder,
                event.nameOrder,
              )}
              name="nameOrder"
            >
              <option value="partner_one_first">Primera persona primero</option>
              <option value="partner_two_first">Segunda persona primero</option>
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              defaultValue={getStringValue(
                detailsValues?.eventDate,
                event.eventDate ?? "",
              )}
              error={detailsState.fieldErrors?.eventDate}
              label="Fecha"
              name="eventDate"
              type="date"
            />
            <TextField
              defaultValue={getStringValue(
                detailsValues?.eventTimezone,
                event.eventTimezone,
              )}
              error={detailsState.fieldErrors?.eventTimezone}
              label="Zona horaria"
              name="eventTimezone"
              required
            />
            <TextField
              defaultValue={getStringValue(detailsValues?.city, event.city ?? "")}
              error={detailsState.fieldErrors?.city}
              label="Ciudad"
              name="city"
            />
          </div>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Mensaje principal
            <textarea
              aria-invalid={Boolean(detailsState.fieldErrors?.mainInvitationMessage)}
              className={`${inputClassName} min-h-28 py-3`}
              defaultValue={getStringValue(
                detailsValues?.mainInvitationMessage,
                event.mainInvitationMessage,
              )}
              name="mainInvitationMessage"
            />
            <FieldError message={detailsState.fieldErrors?.mainInvitationMessage} />
          </label>
          <SaveFooter state={detailsState} />
        </form>
      </EditorSection>

      <EditorSection
        id="lugares"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Ceremonia y recepcion"
      >
        <form
          action={locationsAction}
          className="grid gap-5"
          onInput={() => markDirty("lugares")}
          onSubmit={() => markSubmitted("lugares")}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <LocationFields
            defaultAddress={getStringValue(
              locationsValues?.ceremonyAddress,
              ceremony?.address ?? "",
            )}
            defaultMapUrl={getStringValue(
              locationsValues?.ceremonyMapUrl,
              ceremony?.mapUrl ?? "",
            )}
            defaultName={getStringValue(
              locationsValues?.ceremonyName,
              ceremony?.name ?? "",
            )}
            defaultTime={getStringValue(
              locationsValues?.ceremonyTime,
              ceremony?.time ?? "",
            )}
            errors={locationsState.fieldErrors}
            label="Ceremonia"
            prefix="ceremony"
          />
          <LocationFields
            defaultAddress={getStringValue(
              locationsValues?.receptionAddress,
              reception?.address ?? "",
            )}
            defaultMapUrl={getStringValue(
              locationsValues?.receptionMapUrl,
              reception?.mapUrl ?? "",
            )}
            defaultName={getStringValue(
              locationsValues?.receptionName,
              reception?.name ?? "",
            )}
            defaultTime={getStringValue(
              locationsValues?.receptionTime,
              reception?.time ?? "",
            )}
            errors={locationsState.fieldErrors}
            label="Recepcion"
            prefix="reception"
          />
          <SaveFooter state={locationsState} />
        </form>
      </EditorSection>

      <EditorSection
        id="contenido"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Confirmacion y cierre"
      >
        <form
          action={contentAction}
          className="grid gap-4"
          onInput={() => markDirty("contenido")}
          onSubmit={() => markSubmitted("contenido")}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <TextField
            defaultValue={getStringValue(
              contentValues?.tagline,
              event.content.tagline ?? "",
            )}
            error={contentState.fieldErrors?.tagline}
            label="Frase de portada (opcional)"
            name="tagline"
          />
          <TextField
            defaultValue={getStringValue(
              contentValues?.dressCodeStyle,
              event.content.dressCode?.style ?? "",
            )}
            error={contentState.fieldErrors?.dressCodeStyle}
            label="Vestimenta"
            name="dressCodeStyle"
          />
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Recomendaciones de vestimenta
            <textarea
              aria-invalid={Boolean(contentState.fieldErrors?.dressCodeRecommendations)}
              className={`${inputClassName} min-h-24 py-3`}
              defaultValue={getStringValue(
                contentValues?.dressCodeRecommendations,
                event.content.dressCode?.general ?? "",
              )}
              name="dressCodeRecommendations"
            />
            <FieldError message={contentState.fieldErrors?.dressCodeRecommendations} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Mensaje de regalos
            <textarea
              aria-invalid={Boolean(contentState.fieldErrors?.giftMessage)}
              className={`${inputClassName} min-h-24 py-3`}
              defaultValue={getStringValue(
                contentValues?.giftMessage,
                event.content.gifts?.find((gift) => gift.kind === "envelope")
                  ?.description ?? "",
              )}
              name="giftMessage"
            />
            <FieldError message={contentState.fieldErrors?.giftMessage} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Mensaje de cierre
            <textarea
              aria-invalid={Boolean(contentState.fieldErrors?.closingMessage)}
              className={`${inputClassName} min-h-28 py-3`}
              defaultValue={getStringValue(
                contentValues?.closingMessage,
                event.content.closingMessage ?? "",
              )}
              name="closingMessage"
            />
            <FieldError message={contentState.fieldErrors?.closingMessage} />
          </label>
          <SaveFooter state={contentState} />
        </form>
      </EditorSection>

      <EditorSection
        id="fotografias"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Fotos"
      >
        <InvitationPhotosEditor event={event} />
      </EditorSection>
    </div>
  );
}

function EditorSection({
  children,
  id,
  openSection,
  setOpenSection,
  title,
}: {
  children: ReactNode;
  id: EditorSectionId;
  openSection: EditorSectionId;
  setOpenSection: (id: EditorSectionId) => void;
  title: string;
}) {
  const isOpen = openSection === id;

  return (
    <section className="rounded-[18px] border border-midnight-navy/10 bg-white/86">
      <button
        aria-expanded={isOpen}
        className="flex min-h-14 w-full items-center justify-between px-5 text-left text-sm font-semibold text-midnight-navy"
        onClick={() => setOpenSection(isOpen ? "" : id)}
        type="button"
      >
        {title}
        <span className="text-lg text-muted-mauve">{isOpen ? "-" : "+"}</span>
      </button>
      <div
        className={[
          "border-t border-midnight-navy/8 p-5",
          isOpen ? "grid" : "hidden",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

function TextField({
  defaultValue,
  error,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue: string;
  error?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
      {label}
      <input
        aria-invalid={Boolean(error)}
        className={inputClassName}
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
      />
      <FieldError message={error} />
    </label>
  );
}

function LocationFields({
  defaultAddress,
  defaultMapUrl,
  defaultName,
  defaultTime,
  errors,
  label,
  prefix,
}: {
  defaultAddress?: string;
  defaultMapUrl?: string;
  defaultName?: string;
  defaultTime?: string;
  errors?: Record<string, string>;
  label: string;
  prefix: "ceremony" | "reception";
}) {
  return (
    <fieldset className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
      <legend className="text-sm font-semibold text-midnight-navy">
        {label}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          defaultValue={defaultName ?? ""}
          error={errors?.[`${prefix}Name`]}
          label="Nombre del lugar"
          name={`${prefix}Name`}
        />
        <TextField
          defaultValue={defaultTime ?? ""}
          error={errors?.[`${prefix}Time`]}
          label="Hora"
          name={`${prefix}Time`}
          type="time"
        />
      </div>
      <TextField
        defaultValue={defaultAddress ?? ""}
        error={errors?.[`${prefix}Address`]}
        label="Direccion"
        name={`${prefix}Address`}
      />
      <TextField
        defaultValue={defaultMapUrl ?? ""}
        error={errors?.[`${prefix}MapUrl`]}
        label="Enlace del mapa"
        name={`${prefix}MapUrl`}
        type="url"
      />
    </fieldset>
  );
}

function SaveFooter({ state }: { state: UpdateContentState }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {pending
          ? "Guardando..."
          : state.error ?? state.success ?? ""}
      </p>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-wait disabled:bg-muted-mauve/55"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : "Guardar seccion"}
      </button>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className="text-sm font-semibold text-[#8A3A3A]">
      {message}
    </span>
  );
}

const inputClassName =
  "min-h-11 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-sm font-medium text-midnight-navy outline-none transition focus:border-muted-mauve";

function getStringValue(
  value: boolean | string | undefined,
  fallback: string,
) {
  return typeof value === "string" ? value : fallback;
}
