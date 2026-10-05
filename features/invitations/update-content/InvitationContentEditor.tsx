"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";

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
  const ceremony = event.content.locations?.find(
    (location) => location.kind === "Ceremonia",
  );
  const reception = event.content.locations?.find(
    (location) => location.kind === "Recepcion",
  );
  const detailsValues = detailsState.values;
  const locationsValues = locationsState.values;
  const contentValues = contentState.values;

  return (
    <div className="grid gap-3">
      <EditorSection
        id="datos"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Datos de la boda"
      >
        <form
          action={detailsAction}
          className="grid gap-4"
          key={detailsState.formKey}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              defaultValue={getStringValue(
                detailsValues?.partnerOneName,
                event.partnerOneName,
              )}
              label="Primera persona"
              name="partnerOneName"
              required
            />
            <TextField
              defaultValue={getStringValue(
                detailsValues?.partnerTwoName,
                event.partnerTwoName,
              )}
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
              label="Fecha"
              name="eventDate"
              type="date"
            />
            <TextField
              defaultValue={getStringValue(
                detailsValues?.eventTimezone,
                event.eventTimezone,
              )}
              label="Zona horaria"
              name="eventTimezone"
              required
            />
            <TextField
              defaultValue={getStringValue(detailsValues?.city, event.city ?? "")}
              label="Ciudad"
              name="city"
            />
          </div>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Mensaje principal
            <textarea
              className={`${inputClassName} min-h-28 py-3`}
              defaultValue={getStringValue(
                detailsValues?.mainInvitationMessage,
                event.mainInvitationMessage,
              )}
              name="mainInvitationMessage"
            />
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
          key={locationsState.formKey}
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
          key={contentState.formKey}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <TextField
            defaultValue={getStringValue(
              contentValues?.tagline,
              event.content.tagline ?? "",
            )}
            label="Frase bajo el hero"
            name="tagline"
          />
          <TextField
            defaultValue={getStringValue(
              contentValues?.dressCodeStyle,
              event.content.dressCode?.style ?? "",
            )}
            label="Vestimenta"
            name="dressCodeStyle"
          />
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Recomendaciones de vestimenta
            <textarea
              className={`${inputClassName} min-h-24 py-3`}
              defaultValue={getStringValue(
                contentValues?.dressCodeRecommendations,
                event.content.dressCode?.women ?? "",
              )}
              name="dressCodeRecommendations"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Mensaje de regalos
            <textarea
              className={`${inputClassName} min-h-24 py-3`}
              defaultValue={getStringValue(
                contentValues?.giftMessage,
                event.content.gifts?.[0]?.description ?? "",
              )}
              name="giftMessage"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Mensaje de cierre
            <textarea
              className={`${inputClassName} min-h-28 py-3`}
              defaultValue={getStringValue(
                contentValues?.closingMessage,
                event.content.closingMessage ?? "",
              )}
              name="closingMessage"
            />
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
      {isOpen ? <div className="border-t border-midnight-navy/8 p-5">{children}</div> : null}
    </section>
  );
}

function TextField({
  defaultValue,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
      {label}
      <input
        className={inputClassName}
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function LocationFields({
  defaultAddress,
  defaultMapUrl,
  defaultName,
  defaultTime,
  label,
  prefix,
}: {
  defaultAddress?: string;
  defaultMapUrl?: string;
  defaultName?: string;
  defaultTime?: string;
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
          label="Nombre del lugar"
          name={`${prefix}Name`}
        />
        <TextField
          defaultValue={defaultTime ?? ""}
          label="Hora"
          name={`${prefix}Time`}
          type="time"
        />
      </div>
      <TextField
        defaultValue={defaultAddress ?? ""}
        label="Direccion"
        name={`${prefix}Address`}
      />
      <TextField
        defaultValue={defaultMapUrl ?? ""}
        label="Mapa"
        name={`${prefix}MapUrl`}
        type="url"
      />
    </fieldset>
  );
}

function SaveFooter({ state }: { state: UpdateContentState }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {state.error ?? state.success ?? ""}
      </p>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition hover:bg-[#7D5F78]"
        type="submit"
      >
        Guardar seccion
      </button>
    </div>
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
