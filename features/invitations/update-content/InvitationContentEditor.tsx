"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  ImagePlus,
  Music,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type { PersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { deleteInvitationImage } from "@/features/media/delete-image/action";
import { InvitationPhotosEditor } from "@/features/media/manage-draft-images/InvitationPhotosEditor";
import {
  finalizeInvitationImageUpload,
  prepareInvitationImageUpload,
} from "@/features/media/upload-image/action";
import {
  finalizeInvitationAudioUpload,
  prepareInvitationAudioUpload,
} from "@/features/media/upload-audio/action";
import {
  allowedAudioExtensionsLabel,
  allowedAudioTypes,
  maxAudioSizeBytes,
  maxAudioSizeLabel,
} from "@/features/media/upload-audio/limits";
import {
  allowedImageExtensionsLabel,
  allowedImageTypes,
  maxImageSizeBytes,
  maxImageSizeLabel,
} from "@/features/media/upload-image/limits";
import type {
  InvitationLocation,
  InvitationTimelineItem,
} from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/client";

import {
  updateFamily,
  updateItinerary,
  updateLocations,
  updateSimpleContent,
  updateStory,
  updateWeddingDetails,
  type UpdateContentState,
} from "./action";

type InvitationContentEditorProps = {
  event: PersonalInvitationEvent;
  initialSection?: "datos" | "contenido" | "fotografias";
};

type EditorSectionId =
  | ""
  | "datos"
  | "lugares"
  | "programa"
  | "familia"
  | "historia"
  | "contenido"
  | "fotografias";
type DirtyStatus = "dirty" | "submitted";
type EditorItineraryItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  iconKey: string;
  dayOffset: string;
};
type EditorFamilyPerson = {
  id: string;
  name: string;
};
type EditorStoryItem = {
  id: string;
  dateOrYear: string;
  title: string;
  description: string;
  image?: NonNullable<PersonalInvitationEvent["content"]["story"]>[number]["image"];
  imageAlt?: string;
  persisted: boolean;
};

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
  const [itineraryState, itineraryAction] = useActionState(
    updateItinerary,
    initialState,
  );
  const [familyState, familyAction] = useActionState(
    updateFamily,
    initialState,
  );
  const [storyState, storyAction] = useActionState(
    updateStory,
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
  const extraLocation = event.content.locations?.find(
    (location) =>
      location.kind !== "Ceremonia" && location.kind !== "Recepcion",
  );
  const detailsValues = detailsState.values;
  const locationsValues = locationsState.values;
  const contentValues = contentState.values;
  const gifts = event.content.gifts ?? [];
  const envelopeGift = gifts.find((gift) => gift.kind === "envelope");
  const yapeGift = gifts.find((gift) => gift.kind === "yape");
  const plinGift = gifts.find((gift) => gift.kind === "plin");
  const bankGift = gifts.find((gift) => gift.kind === "bankTransfer");
  const registryGift = gifts.find((gift) => gift.kind === "externalRegistry");
  const hasUnsavedChanges = useMemo(
    () =>
      dirtyForms.datos === "dirty" ||
      (dirtyForms.datos === "submitted" && Boolean(detailsState.error)) ||
      dirtyForms.lugares === "dirty" ||
      (dirtyForms.lugares === "submitted" && Boolean(locationsState.error)) ||
      dirtyForms.programa === "dirty" ||
      (dirtyForms.programa === "submitted" && Boolean(itineraryState.error)) ||
      dirtyForms.familia === "dirty" ||
      (dirtyForms.familia === "submitted" && Boolean(familyState.error)) ||
      dirtyForms.historia === "dirty" ||
      (dirtyForms.historia === "submitted" && Boolean(storyState.error)) ||
      dirtyForms.contenido === "dirty" ||
      (dirtyForms.contenido === "submitted" && Boolean(contentState.error)),
    [
      contentState.error,
      detailsState.error,
      dirtyForms,
      familyState.error,
      itineraryState.error,
      locationsState.error,
      storyState.error,
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
          Cambios sin guardar. Guarda antes de salir o recargar la página.
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
              className={selectClassName}
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
            <div className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Zona horaria
              <input
                name="eventTimezone"
                type="hidden"
                value={getStringValue(
                  detailsValues?.eventTimezone,
                  event.eventTimezone,
                )}
              />
              <p className={`${inputClassName} flex items-center`}>
                Horarios de Perú
              </p>
              <FieldError message={detailsState.fieldErrors?.eventTimezone} />
            </div>
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
          <SaveFooter
            canSubmit={
              dirtyForms.datos === "dirty" ||
              (dirtyForms.datos === "submitted" && Boolean(detailsState.error))
            }
            state={detailsState}
          />
        </form>
      </EditorSection>

      <EditorSection
        id="lugares"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Ceremonia y recepción"
      >
        <form
          action={locationsAction}
          className="grid gap-5"
          onChange={() => markDirty("lugares")}
          onInput={() => markDirty("lugares")}
          onSubmit={() => markSubmitted("lugares")}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <LocationFields
            defaultAddress={getStringValue(
              locationsValues?.ceremonyAddress,
              ceremony?.address ?? "",
            )}
            defaultImage={ceremony?.image}
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
            eventId={event.id}
            label="Ceremonia"
            onDirty={() => markDirty("lugares")}
            prefix="ceremony"
          />
          <LocationFields
            defaultAddress={getStringValue(
              locationsValues?.receptionAddress,
              reception?.address ?? "",
            )}
            defaultImage={reception?.image}
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
            eventId={event.id}
            label="Recepción"
            onDirty={() => markDirty("lugares")}
            prefix="reception"
          />
          <LocationFields
            defaultAddress={getStringValue(
              locationsValues?.extraAddress,
              extraLocation?.address ?? "",
            )}
            defaultImage={extraLocation?.image}
            defaultKind={getStringValue(
              locationsValues?.extraKind,
              extraLocation?.kind ?? "Lugar adicional",
            )}
            defaultMapUrl={getStringValue(
              locationsValues?.extraMapUrl,
              extraLocation?.mapUrl ?? "",
            )}
            defaultName={getStringValue(
              locationsValues?.extraName,
              extraLocation?.name ?? "",
            )}
            defaultTime={getStringValue(
              locationsValues?.extraTime,
              extraLocation?.time ?? "",
            )}
            errors={locationsState.fieldErrors}
            eventId={event.id}
            label="Lugar adicional (opcional)"
            onDirty={() => markDirty("lugares")}
            prefix="extra"
          />
          <SaveFooter
            canSubmit={
              dirtyForms.lugares === "dirty" ||
              (dirtyForms.lugares === "submitted" &&
                Boolean(locationsState.error))
            }
            state={locationsState}
          />
        </form>
      </EditorSection>

      <EditorSection
        id="programa"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Programa"
      >
        <form
          action={itineraryAction}
          className="grid gap-5"
          onChange={() => markDirty("programa")}
          onInput={() => markDirty("programa")}
          onSubmit={() => markSubmitted("programa")}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <ItineraryFields
            defaultItems={event.content.itinerary}
            onDirty={() => markDirty("programa")}
          />
          <SaveFooter
            canSubmit={
              dirtyForms.programa === "dirty" ||
              (dirtyForms.programa === "submitted" &&
                Boolean(itineraryState.error))
            }
            state={itineraryState}
          />
        </form>
      </EditorSection>

      <EditorSection
        id="familia"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Nuestra historia / Familia"
      >
        <form
          action={familyAction}
          className="grid gap-5"
          onChange={() => markDirty("familia")}
          onInput={() => markDirty("familia")}
          onSubmit={() => markSubmitted("familia")}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <FamilyFields
            defaultFamily={event.content.family}
            onDirty={() => markDirty("familia")}
          />
          <SaveFooter
            canSubmit={
              dirtyForms.familia === "dirty" ||
              (dirtyForms.familia === "submitted" &&
                Boolean(familyState.error))
            }
            state={familyState}
          />
        </form>
      </EditorSection>

      <EditorSection
        id="historia"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Nuestra historia"
      >
        <form
          action={storyAction}
          className="grid gap-5"
          onChange={() => markDirty("historia")}
          onInput={() => markDirty("historia")}
          onSubmit={() => markSubmitted("historia")}
        >
          <input name="eventId" type="hidden" value={event.id} />
          <StoryFields
            defaultItems={event.content.story}
            eventId={event.id}
            onDirty={() => markDirty("historia")}
          />
          <SaveFooter
            canSubmit={
              dirtyForms.historia === "dirty" ||
              (dirtyForms.historia === "submitted" &&
                Boolean(storyState.error))
            }
            state={storyState}
          />
        </form>
      </EditorSection>

      <EditorSection
        id="contenido"
        openSection={openSection}
        setOpenSection={setOpenSection}
        title="Confirmación y cierre"
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
              contentValues?.rsvpDeadline,
              event.rsvpDeadline ?? "",
            )}
            error={contentState.fieldErrors?.rsvpDeadline}
            label="Fecha limite de RSVP (opcional)"
            name="rsvpDeadline"
            type="date"
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
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Recomendaciones para ellos (opcional)
              <textarea
                aria-invalid={Boolean(contentState.fieldErrors?.dressCodeMen)}
                className={`${inputClassName} min-h-24 py-3`}
                defaultValue={getStringValue(
                  contentValues?.dressCodeMen,
                  event.content.dressCode?.men ?? "",
                )}
                name="dressCodeMen"
              />
              <FieldError message={contentState.fieldErrors?.dressCodeMen} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Recomendaciones para ellas (opcional)
              <textarea
                aria-invalid={Boolean(contentState.fieldErrors?.dressCodeWomen)}
                className={`${inputClassName} min-h-24 py-3`}
                defaultValue={getStringValue(
                  contentValues?.dressCodeWomen,
                  event.content.dressCode?.women ?? "",
                )}
                name="dressCodeWomen"
              />
              <FieldError message={contentState.fieldErrors?.dressCodeWomen} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Niños o acompañantes (opcional)
              <textarea
                aria-invalid={Boolean(contentState.fieldErrors?.dressCodeChildren)}
                className={`${inputClassName} min-h-24 py-3`}
                defaultValue={getStringValue(
                  contentValues?.dressCodeChildren,
                  event.content.dressCode?.children ?? "",
                )}
                name="dressCodeChildren"
              />
              <FieldError message={contentState.fieldErrors?.dressCodeChildren} />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Colores a evitar (opcional)
            <textarea
              aria-describedby="dressCodeAvoidColorsHelp"
              aria-invalid={Boolean(contentState.fieldErrors?.dressCodeAvoidColors)}
              className={`${inputClassName} min-h-24 py-3`}
              defaultValue={getStringValue(
                contentValues?.dressCodeAvoidColors,
                formatAvoidColors(event.content.dressCode?.avoidColors),
              )}
              name="dressCodeAvoidColors"
              placeholder={"Rojo #8F1D2C\nBlanco #FFFFFF"}
            />
            <span
              className="text-xs font-medium leading-5 text-midnight-navy/58"
              id="dressCodeAvoidColorsHelp"
            >
              Escribe un color por linea con nombre y valor hexadecimal.
            </span>
            <FieldError message={contentState.fieldErrors?.dressCodeAvoidColors} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            Mensaje de regalos
            <textarea
              aria-invalid={Boolean(contentState.fieldErrors?.giftMessage)}
              className={`${inputClassName} min-h-24 py-3`}
              defaultValue={getStringValue(
                contentValues?.giftMessage,
                envelopeGift?.description ?? "",
              )}
              name="giftMessage"
            />
            <FieldError message={contentState.fieldErrors?.giftMessage} />
          </label>
          <div className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
            <p className="text-sm font-semibold text-midnight-navy">
              Yape / Plin (opcional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                defaultValue={getStringValue(
                  contentValues?.yapeOwner,
                  yapeGift?.owner ?? "",
                )}
                error={contentState.fieldErrors?.yapeOwner}
                label="Titular Yape"
                name="yapeOwner"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.yapePhone,
                  yapeGift?.phone ?? "",
                )}
                error={contentState.fieldErrors?.yapePhone}
                label="Numero Yape"
                name="yapePhone"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.plinOwner,
                  plinGift?.owner ?? "",
                )}
                error={contentState.fieldErrors?.plinOwner}
                label="Titular Plin"
                name="plinOwner"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.plinPhone,
                  plinGift?.phone ?? "",
                )}
                error={contentState.fieldErrors?.plinPhone}
                label="Numero Plin"
                name="plinPhone"
              />
            </div>
          </div>
          <div className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
            <p className="text-sm font-semibold text-midnight-navy">
              Transferencia bancaria (opcional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                defaultValue={getStringValue(
                  contentValues?.bankOwner,
                  bankGift?.owner ?? bankGift?.description ?? "",
                )}
                error={contentState.fieldErrors?.bankOwner}
                label="Titular"
                name="bankOwner"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.bankName,
                  bankGift?.bank ?? "",
                )}
                error={contentState.fieldErrors?.bankName}
                label="Banco"
                name="bankName"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.bankAccountType,
                  bankGift?.accountType ?? "",
                )}
                error={contentState.fieldErrors?.bankAccountType}
                label="Tipo de cuenta"
                name="bankAccountType"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.bankCurrency,
                  bankGift?.currency ?? "",
                )}
                error={contentState.fieldErrors?.bankCurrency}
                label="Moneda"
                name="bankCurrency"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.bankAccountNumber,
                  bankGift?.accountNumber ?? "",
                )}
                error={contentState.fieldErrors?.bankAccountNumber}
                label="Numero de cuenta"
                name="bankAccountNumber"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.bankCci,
                  bankGift?.cci ?? "",
                )}
                error={contentState.fieldErrors?.bankCci}
                label="CCI"
                name="bankCci"
              />
            </div>
          </div>
          <div className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
            <p className="text-sm font-semibold text-midnight-navy">
              Registro externo (opcional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                defaultValue={getStringValue(
                  contentValues?.registryUrl,
                  registryGift?.url ?? "",
                )}
                error={contentState.fieldErrors?.registryUrl}
                label="URL del registro"
                name="registryUrl"
                type="url"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.registryLabel,
                  registryGift?.linkLabel ?? registryGift?.title ?? "",
                )}
                error={contentState.fieldErrors?.registryLabel}
                label="Etiqueta del boton"
                name="registryLabel"
              />
            </div>
            <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Descripcion del registro
              <textarea
                aria-invalid={Boolean(contentState.fieldErrors?.registryDescription)}
                className={`${inputClassName} min-h-20 py-3`}
                defaultValue={getStringValue(
                  contentValues?.registryDescription,
                  registryGift?.description ?? "",
                )}
                name="registryDescription"
              />
              <FieldError message={contentState.fieldErrors?.registryDescription} />
            </label>
          </div>
          <div className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-midnight-navy">
              <input
                className="size-4 accent-muted-mauve"
                defaultChecked={
                  typeof contentValues?.musicEnabled === "boolean"
                    ? contentValues.musicEnabled
                    : Boolean(event.content.music?.enabled)
                }
                name="musicEnabled"
                type="checkbox"
              />
              Musica opcional
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                defaultValue={getStringValue(
                  contentValues?.musicTitle,
                  event.content.music?.title ?? "",
                )}
                error={contentState.fieldErrors?.musicTitle}
                label="Titulo"
                name="musicTitle"
              />
              <TextField
                defaultValue={getStringValue(
                  contentValues?.musicArtist,
                  event.content.music?.artist ?? "",
                )}
                error={contentState.fieldErrors?.musicArtist}
                label="Artista"
                name="musicArtist"
              />
            </div>
            <MusicAudioUploader
              audio={getMusicAudioPreview(event.content.music)}
              error={contentState.fieldErrors?.musicAudioFile}
              eventId={event.id}
            />
            <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Volumen
              <input
                className="accent-muted-mauve"
                defaultValue={getStringValue(
                  contentValues?.musicVolume,
                  String(event.content.music?.volume ?? 0.45),
                )}
                max="1"
                min="0"
                name="musicVolume"
                step="0.05"
                type="range"
              />
              <FieldError message={contentState.fieldErrors?.musicVolume} />
            </label>
          </div>
          <div className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-midnight-navy">
              <input
                className="size-4 accent-muted-mauve"
                defaultChecked={
                  typeof contentValues?.songSuggestionsEnabled === "boolean"
                    ? contentValues.songSuggestionsEnabled
                    : Boolean(event.content.songSuggestions?.enabled)
                }
                name="songSuggestionsEnabled"
                type="checkbox"
              />
              Sugerencias musicales
            </label>
            <TextField
              defaultValue={getStringValue(
                contentValues?.songSuggestionsTitle,
                event.content.songSuggestions?.title ?? "",
              )}
              error={contentState.fieldErrors?.songSuggestionsTitle}
              label="Titulo de la seccion"
              name="songSuggestionsTitle"
            />
            <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Descripcion opcional
              <textarea
                aria-invalid={Boolean(
                  contentState.fieldErrors?.songSuggestionsDescription,
                )}
                className={`${inputClassName} min-h-20 py-3`}
                defaultValue={getStringValue(
                  contentValues?.songSuggestionsDescription,
                  event.content.songSuggestions?.description ?? "",
                )}
                name="songSuggestionsDescription"
              />
              <FieldError
                message={contentState.fieldErrors?.songSuggestionsDescription}
              />
            </label>
          </div>
          <div className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-midnight-navy">
              <input
                className="size-4 accent-muted-mauve"
                defaultChecked={
                  typeof contentValues?.collaborativeAlbumEnabled === "boolean"
                    ? contentValues.collaborativeAlbumEnabled
                    : Boolean(event.content.collaborativeAlbum?.enabled)
                }
                name="collaborativeAlbumEnabled"
                type="checkbox"
              />
              Album colaborativo
            </label>
            <TextField
              defaultValue={getStringValue(
                contentValues?.collaborativeAlbumTitle,
                event.content.collaborativeAlbum?.title ?? "",
              )}
              error={contentState.fieldErrors?.collaborativeAlbumTitle}
              label="Titulo de la seccion"
              name="collaborativeAlbumTitle"
            />
            <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
              Descripcion opcional
              <textarea
                aria-invalid={Boolean(
                  contentState.fieldErrors?.collaborativeAlbumDescription,
                )}
                className={`${inputClassName} min-h-20 py-3`}
                defaultValue={getStringValue(
                  contentValues?.collaborativeAlbumDescription,
                  event.content.collaborativeAlbum?.description ?? "",
                )}
                name="collaborativeAlbumDescription"
              />
              <FieldError
                message={contentState.fieldErrors?.collaborativeAlbumDescription}
              />
            </label>
          </div>
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
          <SaveFooter
            canSubmit={
              dirtyForms.contenido === "dirty" ||
              (dirtyForms.contenido === "submitted" &&
                Boolean(contentState.error))
            }
            state={contentState}
          />
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
    <section className="overflow-hidden rounded-[18px] border border-midnight-navy/10 bg-white/86 transition-shadow duration-300 ease-out has-[[aria-expanded='true']]:shadow-[0_14px_34px_rgba(16,42,67,0.035)]">
      <button
        aria-expanded={isOpen}
        className="flex min-h-14 w-full items-center justify-between px-5 text-left text-sm font-semibold text-midnight-navy transition-colors duration-300 ease-out hover:bg-porcelain/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-muted-mauve"
        onClick={() => setOpenSection(isOpen ? "" : id)}
        type="button"
      >
        {title}
        <span
          aria-hidden="true"
          className={[
            "relative size-5 text-muted-mauve transition-transform duration-300 ease-out",
            isOpen ? "rotate-180" : "rotate-0",
          ].join(" ")}
        >
          <span className="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
          <span
            className={[
              "absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ease-out",
              isOpen ? "opacity-0" : "opacity-100",
            ].join(" ")}
          />
        </span>
      </button>
      <div
        className={[
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={[
              "border-t border-midnight-navy/8 p-5 transition-transform duration-300 ease-out motion-reduce:transition-none",
              isOpen ? "translate-y-0" : "-translate-y-2",
            ].join(" ")}
          >
            {children}
          </div>
        </div>
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

function TimeSelectField({
  defaultValue,
  error,
  label,
  name,
  onDirty,
}: {
  defaultValue: string;
  error?: string;
  label: string;
  name: string;
  onDirty: () => void;
}) {
  const initialTime = parseTimeValue(defaultValue);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState(initialTime.period);
  const [openMenu, setOpenMenu] = useState<TimeMenu>(null);
  const value = formatTimeValue(hour, minute, period);
  const readableValue = value ? formatReadableTime(value) : "Sin hora definida";

  function clearTime() {
    setHour("");
    setMinute("");
    setPeriod("");
    setOpenMenu(null);
    onDirty();
  }

  function selectHour(nextHour: string) {
    setHour(nextHour);
    setOpenMenu(null);
    onDirty();
  }

  function selectMinute(nextMinute: string) {
    setMinute(nextMinute);
    setOpenMenu(null);
    onDirty();
  }

  return (
    <div
      className="grid gap-2 text-sm font-semibold text-midnight-navy"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpenMenu(null);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-midnight-navy/5 px-2 py-0.5 text-xs font-semibold text-midnight-navy/70">
            {value ? readableValue : "Opcional"}
          </span>
          {value ? (
            <button
              className="text-xs font-semibold text-muted-mauve underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
              onClick={clearTime}
              type="button"
            >
              Limpiar
            </button>
          ) : null}
        </span>
      </div>
      <input name={name} type="hidden" value={value} />
      <div className="grid gap-1.5">
        <div
          aria-invalid={Boolean(error)}
          className="flex min-h-14 items-center gap-2 rounded-2xl border border-midnight-navy/12 bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus-within:border-muted-mauve focus-within:ring-2 focus-within:ring-muted-mauve/10"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted-mauve/12 text-muted-mauve ring-1 ring-muted-mauve/12">
            <Clock3 aria-hidden="true" className="size-4" />
          </span>
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center rounded-xl border border-midnight-navy/8 bg-white shadow-sm">
            <TimeMenuButton
              label={`${label}: hora`}
              menu="hour"
              onOpenChange={setOpenMenu}
              onSelect={selectHour}
              openMenu={openMenu}
              options={hourOptions}
              placeholder="Hora"
              value={hour}
            />
            <span
              aria-hidden="true"
              className="px-0.5 text-sm font-bold text-midnight-navy/30"
            >
              :
            </span>
            <TimeMenuButton
              label={`${label}: minutos`}
              menu="minute"
              onOpenChange={setOpenMenu}
              onSelect={selectMinute}
              openMenu={openMenu}
              options={minuteOptions}
              placeholder="Min"
              value={minute}
            />
          </div>
          <div
            aria-label={`${label}: periodo`}
            className="grid h-9 w-28 shrink-0 grid-cols-2 rounded-xl border border-midnight-navy/8 bg-white p-1 shadow-sm"
            role="group"
          >
            <PeriodButton
              active={period === "AM"}
              label="a. m."
              onClick={() => {
                setPeriod("AM");
                onDirty();
              }}
            />
            <PeriodButton
              active={period === "PM"}
              label="p. m."
              onClick={() => {
                setPeriod("PM");
                onDirty();
              }}
            />
          </div>
        </div>
      </div>
      <FieldError message={error} />
    </div>
  );
}

type TimeMenu = "hour" | "minute" | null;

function TimeMenuButton({
  label,
  menu,
  onOpenChange,
  onSelect,
  openMenu,
  options,
  placeholder,
  value,
}: {
  label: string;
  menu: Exclude<TimeMenu, null>;
  onOpenChange: (menu: TimeMenu) => void;
  onSelect: (value: string) => void;
  openMenu: TimeMenu;
  options: string[];
  placeholder: string;
  value: string;
}) {
  const isOpen = openMenu === menu;

  return (
    <div className="relative min-w-0">
      <button
        aria-expanded={isOpen}
        aria-label={label}
        className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-2 text-sm font-semibold text-midnight-navy transition hover:bg-porcelain focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
        onClick={() => onOpenChange(isOpen ? null : menu)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onOpenChange(null);
          }
        }}
        type="button"
      >
        <span>{value ? Number(value) : placeholder}</span>
        <span
          aria-hidden="true"
          className={[
            "size-1.5 rotate-45 border-b-2 border-r-2 border-current transition-transform",
            isOpen ? "translate-y-0.5 rotate-[225deg]" : "-translate-y-0.5",
          ].join(" ")}
        />
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-10 z-20 max-h-48 w-full overflow-y-auto rounded-xl border border-midnight-navy/10 bg-white p-1 shadow-[0_18px_48px_rgba(16,42,67,0.16)]">
          {options.map((option) => (
            <button
              aria-pressed={option === value}
              className={[
                "flex min-h-9 w-full items-center justify-center rounded-lg text-sm font-semibold transition",
                option === value
                  ? "bg-muted-mauve text-white"
                  : "text-midnight-navy hover:bg-porcelain",
              ].join(" ")}
              key={option}
              onClick={() => onSelect(option)}
              type="button"
            >
              {menu === "hour" ? Number(option) : option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PeriodButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={[
        "h-7 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
        active
          ? "bg-white text-muted-mauve shadow-sm"
          : "text-midnight-navy/72 hover:bg-porcelain hover:text-midnight-navy",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function FamilyFields({
  defaultFamily,
  onDirty,
}: {
  defaultFamily: PersonalInvitationEvent["content"]["family"];
  onDirty: () => void;
}) {
  const [partnerOneFamily, setPartnerOneFamily] = useState(() =>
    normalizeFamilyRows(defaultFamily?.groomParents),
  );
  const [partnerTwoFamily, setPartnerTwoFamily] = useState(() =>
    normalizeFamilyRows(defaultFamily?.brideParents),
  );
  const [godparents, setGodparents] = useState(() =>
    normalizeFamilyRows(defaultFamily?.godparents),
  );
  const [witnesses, setWitnesses] = useState(() =>
    normalizeFamilyRows(defaultFamily?.witnesses),
  );

  return (
    <div className="grid gap-5">
      <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
        Introduccion opcional
        <textarea
          className={`${inputClassName} min-h-24 py-3`}
          defaultValue={defaultFamily?.intro ?? ""}
          name="familyIntro"
          placeholder="Con la alegria de nuestras familias..."
        />
      </label>
      <FamilyGroupFields
        label="Personas importantes de la primera persona"
        name="partnerOneFamily"
        onDirty={onDirty}
        rows={partnerOneFamily}
        setRows={setPartnerOneFamily}
      />
      <FamilyGroupFields
        label="Personas importantes de la segunda persona"
        name="partnerTwoFamily"
        onDirty={onDirty}
        rows={partnerTwoFamily}
        setRows={setPartnerTwoFamily}
      />
      <FamilyGroupFields
        label="Padrinos o personas de honor"
        name="godparents"
        onDirty={onDirty}
        rows={godparents}
        setRows={setGodparents}
      />
      <FamilyGroupFields
        label="Testigos"
        name="witnesses"
        onDirty={onDirty}
        rows={witnesses}
        setRows={setWitnesses}
      />
    </div>
  );
}

function FamilyGroupFields({
  label,
  name,
  onDirty,
  rows,
  setRows,
}: {
  label: string;
  name: "partnerOneFamily" | "partnerTwoFamily" | "godparents" | "witnesses";
  onDirty: () => void;
  rows: EditorFamilyPerson[];
  setRows: Dispatch<SetStateAction<EditorFamilyPerson[]>>;
}) {
  function addRow() {
    setRows((current) => [...current, { id: createEditorId(), name: "" }]);
    onDirty();
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
    onDirty();
  }

  function updateRow(id: string, value: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, name: value } : row)),
    );
    onDirty();
  }

  function moveRow(id: string, direction: -1 | 1) {
    setRows((current) => {
      const index = current.findIndex((row) => row.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(nextIndex, 0, row);
      return next;
    });
    onDirty();
  }

  return (
    <fieldset className="grid gap-3 rounded-[18px] border border-midnight-navy/10 p-4">
      <legend className="px-1 text-sm font-semibold text-midnight-navy">
        {label}
      </legend>
      {rows.length ? (
        <div className="grid gap-3">
          {rows.map((row, index) => (
            <div
              className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              key={row.id}
            >
              <div className="flex gap-2">
                <button
                  aria-label={`Subir ${label.toLowerCase()} ${index + 1}`}
                  className="inline-flex size-10 items-center justify-center rounded-2xl border border-midnight-navy/10 bg-white text-midnight-navy/70 transition hover:text-muted-mauve disabled:cursor-not-allowed disabled:opacity-35"
                  disabled={index === 0}
                  onClick={() => moveRow(row.id, -1)}
                  type="button"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </button>
                <button
                  aria-label={`Bajar ${label.toLowerCase()} ${index + 1}`}
                  className="inline-flex size-10 items-center justify-center rounded-2xl border border-midnight-navy/10 bg-white text-midnight-navy/70 transition hover:text-muted-mauve disabled:cursor-not-allowed disabled:opacity-35"
                  disabled={index === rows.length - 1}
                  onClick={() => moveRow(row.id, 1)}
                  type="button"
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                </button>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                <span className="sr-only">{label} {index + 1}</span>
                <input
                  className={inputClassName}
                  name={name}
                  onChange={(event) => updateRow(row.id, event.target.value)}
                  placeholder="Nombre completo"
                  value={row.name}
                />
              </label>
              <button
                aria-label={`Quitar ${label.toLowerCase()} ${index + 1}`}
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-[#8A3A3A]/20 bg-white text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5"
                onClick={() => removeRow(row.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-midnight-navy/14 bg-white px-4 py-5 text-center text-sm font-semibold text-midnight-navy/58">
          Opcional. Si queda vacio no se mostrara en la invitacion.
        </div>
      )}
      <button
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-muted-mauve/25 bg-white px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        disabled={rows.length >= 12}
        onClick={addRow}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Agregar
      </button>
    </fieldset>
  );
}

function normalizeFamilyRows(names?: string[]) {
  return (names ?? []).map((name) => ({
    id: createEditorId(),
    name,
  }));
}

function StoryFields({
  defaultItems,
  eventId,
  onDirty,
}: {
  defaultItems: PersonalInvitationEvent["content"]["story"];
  eventId: string;
  onDirty: () => void;
}) {
  const [items, setItems] = useState<EditorStoryItem[]>(() =>
    normalizeStoryItems(defaultItems),
  );

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: createEditorId(),
        dateOrYear: "",
        title: "",
        description: "",
        persisted: false,
      },
    ]);
    onDirty();
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    onDirty();
  }

  function updateItem(
    id: string,
    key: keyof Omit<EditorStoryItem, "id">,
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
    onDirty();
  }

  function moveItem(id: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
    onDirty();
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-midnight-navy/10 bg-porcelain/45 px-4 py-3 text-sm leading-6 text-midnight-navy/70">
        Agrega hasta cinco hitos. La fecha puede ser un aÃ±o o una fecha
        completa; las fotos heredadas se conservan al guardar.
      </div>
      {items.length ? (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <fieldset
              className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4"
              key={item.id}
            >
              <legend className="px-1 text-sm font-semibold text-midnight-navy">
                Hito {index + 1}
              </legend>
              <input name="storyId" type="hidden" value={item.id} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    aria-label={`Subir hito ${index + 1}`}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-midnight-navy/10 bg-white text-midnight-navy/70 transition hover:text-muted-mauve disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={index === 0}
                    onClick={() => moveItem(item.id, -1)}
                    type="button"
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    aria-label={`Bajar hito ${index + 1}`}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-midnight-navy/10 bg-white text-midnight-navy/70 transition hover:text-muted-mauve disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(item.id, 1)}
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/20 bg-white px-4 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5"
                  onClick={() => removeItem(item.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Quitar
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                  Fecha o aÃ±o
                  <input
                    className={selectClassName}
                    name="storyDateOrYear"
                    onChange={(event) =>
                      updateItem(item.id, "dateOrYear", event.target.value)
                    }
                    placeholder="2024 o 2024-08-17"
                    value={item.dateOrYear}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                  Titulo
                  <input
                    className={selectClassName}
                    name="storyTitle"
                    onChange={(event) =>
                      updateItem(item.id, "title", event.target.value)
                    }
                    placeholder="Como nos conocimos"
                    value={item.title}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                Descripcion opcional
                <textarea
                  className={`${inputClassName} min-h-24 py-3`}
                  name="storyDescription"
                  onChange={(event) =>
                    updateItem(item.id, "description", event.target.value)
                  }
                  value={item.description}
                />
              </label>
              {item.persisted ? (
                <StoryImageUploader
                  eventId={eventId}
                  image={getStoryImagePreview(item)}
                  storyItemId={item.id}
                  title={`Foto del hito ${index + 1}`}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-midnight-navy/14 bg-white px-4 py-4 text-center text-sm font-semibold text-midnight-navy/58">
                  Guarda este hito antes de subir su foto.
                </div>
              )}
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-midnight-navy/14 bg-white px-4 text-center text-sm font-semibold text-midnight-navy/58">
          Aun no hay hitos de historia.
        </div>
      )}
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-muted-mauve/25 bg-white px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        disabled={items.length >= 5}
        onClick={addItem}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Agregar hito
      </button>
    </div>
  );
}

function normalizeStoryItems(
  items: PersonalInvitationEvent["content"]["story"],
) {
  return [...(items ?? [])]
    .map((item, index) => ({
      id: item.id ?? createEditorId(),
      dateOrYear: String(item.date ?? item.year ?? item.time ?? ""),
      title: item.title ?? "",
      description: item.description ?? "",
      image: item.image,
      imageAlt: item.imageAlt,
      order: item.order ?? index,
      persisted: Boolean(item.id),
    }))
    .sort((first, second) => first.order - second.order)
    .map((item) => ({
      id: item.id,
      dateOrYear: item.dateOrYear,
      title: item.title,
      description: item.description,
      image: item.image,
      imageAlt: item.imageAlt,
      persisted: item.persisted,
    }));
}

function ItineraryFields({
  defaultItems,
  onDirty,
}: {
  defaultItems?: InvitationTimelineItem[];
  onDirty: () => void;
}) {
  const [items, setItems] = useState<EditorItineraryItem[]>(() =>
    normalizeItineraryItems(defaultItems),
  );

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: createEditorId(),
        time: "",
        title: "",
        description: "",
        iconKey: "",
        dayOffset: "0",
      },
    ]);
    onDirty();
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    onDirty();
  }

  function updateItem(
    id: string,
    key: keyof Omit<EditorItineraryItem, "id">,
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
    onDirty();
  }

  function moveItem(id: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
    onDirty();
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-midnight-navy/10 bg-porcelain/45 px-4 py-3 text-sm leading-6 text-midnight-navy/70">
        Agrega los momentos en el orden en que deben aparecer. Una hora de
        madrugada puede quedarse al final si la subes o bajas manualmente.
      </div>
      {items.length ? (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <fieldset
              className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4"
              key={item.id}
            >
              <legend className="px-1 text-sm font-semibold text-midnight-navy">
                Momento {index + 1}
              </legend>
              <input name="itineraryId" type="hidden" value={item.id} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    aria-label={`Subir momento ${index + 1}`}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-midnight-navy/10 bg-white text-midnight-navy/70 transition hover:text-muted-mauve disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={index === 0}
                    onClick={() => moveItem(item.id, -1)}
                    type="button"
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    aria-label={`Bajar momento ${index + 1}`}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-midnight-navy/10 bg-white text-midnight-navy/70 transition hover:text-muted-mauve disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(item.id, 1)}
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/20 bg-white px-4 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5"
                  onClick={() => removeItem(item.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Quitar
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                <TimeSelectField
                  defaultValue={item.time}
                  label="Hora"
                  name="itineraryTime"
                  onDirty={onDirty}
                />
                <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                  Titulo
                  <input
                    className={inputClassName}
                    name="itineraryTitle"
                    onChange={(event) =>
                      updateItem(item.id, "title", event.target.value)
                    }
                    placeholder="Ceremonia, recepcion, brindis..."
                    value={item.title}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                Descripcion opcional
                <textarea
                  className={`${inputClassName} min-h-24 py-3`}
                  name="itineraryDescription"
                  onChange={(event) =>
                    updateItem(item.id, "description", event.target.value)
                  }
                  value={item.description}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                  Icono opcional
                  <select
                    className={inputClassName}
                    name="itineraryIconKey"
                    onChange={(event) =>
                      updateItem(item.id, "iconKey", event.target.value)
                    }
                    value={item.iconKey}
                  >
                    <option value="">Sin icono</option>
                    <option value="heart">Corazon</option>
                    <option value="mapPin">Lugar</option>
                    <option value="utensils">Cena</option>
                    <option value="music">Musica</option>
                    <option value="sparkles">Celebracion</option>
                    <option value="camera">Foto</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
                  Dia
                  <select
                    className={inputClassName}
                    name="itineraryDayOffset"
                    onChange={(event) =>
                      updateItem(item.id, "dayOffset", event.target.value)
                    }
                    value={item.dayOffset}
                  >
                    <option value="0">Mismo dia</option>
                    <option value="1">Dia siguiente</option>
                    <option value="2">Dos dias despues</option>
                    <option value="3">Tres dias despues</option>
                  </select>
                </label>
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-midnight-navy/14 bg-white px-4 text-center text-sm font-semibold text-midnight-navy/58">
          Aun no hay momentos en el programa.
        </div>
      )}
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-muted-mauve/25 bg-white px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        disabled={items.length >= 10}
        onClick={addItem}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Agregar momento
      </button>
    </div>
  );
}

function normalizeItineraryItems(items?: InvitationTimelineItem[]) {
  return (items ?? [])
    .map((item, index) => ({
      id: item.id ?? createEditorId(),
      time: item.time ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      iconKey: item.iconKey ?? "",
      dayOffset: String(item.dayOffset ?? 0),
      order: item.order ?? index,
    }))
    .sort((first, second) => first.order - second.order)
    .map((item) => ({
      id: item.id,
      time: item.time,
      title: item.title,
      description: item.description,
      iconKey: item.iconKey,
      dayOffset: item.dayOffset,
    }));
}

function createEditorId() {
  return crypto.randomUUID();
}

function LocationFields({
  defaultAddress,
  defaultImage,
  defaultKind,
  defaultMapUrl,
  defaultName,
  defaultTime,
  errors,
  eventId,
  label,
  onDirty,
  prefix,
}: {
  defaultAddress?: string;
  defaultImage?: InvitationLocation["image"];
  defaultKind?: string;
  defaultMapUrl?: string;
  defaultName?: string;
  defaultTime?: string;
  errors?: Record<string, string>;
  eventId: string;
  label: string;
  onDirty: () => void;
  prefix: "ceremony" | "extra" | "reception";
}) {
  const locationKind =
    prefix === "ceremony"
      ? "Ceremonia"
      : prefix === "reception"
        ? "Recepcion"
        : "Lugar adicional";
  const locationImage = getLocationImage(defaultImage);

  return (
    <fieldset className="grid gap-4 rounded-[18px] border border-midnight-navy/10 p-4">
      <legend className="text-sm font-semibold text-midnight-navy">
        {label}
      </legend>
      {prefix === "extra" ? (
        <TextField
          defaultValue={defaultKind ?? "Lugar adicional"}
          error={errors?.extraKind}
          label="Tipo de lugar"
          name="extraKind"
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          defaultValue={defaultName ?? ""}
          error={errors?.[`${prefix}Name`]}
          label="Nombre del lugar"
          name={`${prefix}Name`}
        />
        <TimeSelectField
          defaultValue={defaultTime ?? ""}
          error={errors?.[`${prefix}Time`]}
          key={`${prefix}Time-${defaultTime ?? ""}`}
          label="Hora"
          name={`${prefix}Time`}
          onDirty={onDirty}
        />
      </div>
      <TextField
        defaultValue={defaultAddress ?? ""}
        error={errors?.[`${prefix}Address`]}
        label="Dirección"
        name={`${prefix}Address`}
      />
      <TextField
        defaultValue={defaultMapUrl ?? ""}
        error={errors?.[`${prefix}MapUrl`]}
        label="Enlace del mapa"
        name={`${prefix}MapUrl`}
        type="url"
      />
      <LocationImageUploader
        eventId={eventId}
        image={locationImage}
        locationKind={locationKind}
        title={`Imagen de ${label.toLowerCase()}`}
      />
    </fieldset>
  );
}

type LocationImagePreview = {
  id?: string;
  name?: string;
  objectPath?: string;
  url: string;
};

type SelectedLocationImage = {
  file: File;
  url: string;
};

type MusicAudioPreview = {
  id?: string;
  objectPath?: string;
  url?: string;
};

function MusicAudioUploader({
  audio,
  error,
  eventId,
}: {
  audio: MusicAudioPreview | null;
  error?: string;
  eventId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [status, setStatus] = useState<{ error?: string; success?: string }>(
    {},
  );
  const [isUploading, setIsUploading] = useState(false);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setSelectedAudio(file);
    setStatus({});
  }

  function clearSelection() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setSelectedAudio(null);
    setStatus({});
  }

  async function uploadSelectedAudio() {
    if (!selectedAudio || isUploading) {
      return;
    }

    const validationError = validateMusicAudio(selectedAudio);

    if (validationError) {
      setStatus({ error: validationError });
      return;
    }

    setIsUploading(true);
    setStatus({ success: "Preparando MP3..." });

    const supabase = createClient();
    const mimeType = getMusicAudioMimeType(selectedAudio);
    let uploadedObject:
      | {
          bucket: string;
          mimeType: string;
          objectPath: string;
          sizeBytes: number;
        }
      | null = null;

    try {
      const prepared = await prepareInvitationAudioUpload({
        eventId,
        fileName: selectedAudio.name,
        mimeType,
        sizeBytes: selectedAudio.size,
      });

      if ("error" in prepared) {
        throw new Error(prepared.error);
      }

      setStatus({ success: "Subiendo MP3..." });

      const { error: uploadError } = await supabase.storage
        .from(prepared.bucket)
        .upload(prepared.objectPath, selectedAudio, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error("No pudimos subir el MP3 a Storage.");
      }

      uploadedObject = {
        bucket: prepared.bucket,
        mimeType,
        objectPath: prepared.objectPath,
        sizeBytes: selectedAudio.size,
      };

      setStatus({ success: "Guardando en el borrador..." });

      const result = await finalizeInvitationAudioUpload({
        eventId,
        mimeType: uploadedObject.mimeType,
        objectPath: uploadedObject.objectPath,
        sizeBytes: uploadedObject.sizeBytes,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      clearSelection();
      setStatus({ success: result.success ?? "MP3 guardado." });
      router.refresh();
    } catch (uploadError) {
      if (uploadedObject) {
        await supabase.storage
          .from(uploadedObject.bucket)
          .remove([uploadedObject.objectPath]);
      }

      setStatus({
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "No pudimos subir el MP3. Intentalo nuevamente.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-midnight-navy/10 bg-porcelain/45 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-midnight-navy">
            Archivo de musica
          </p>
          <p className="mt-1 text-xs leading-5 text-midnight-navy/62">
            {allowedAudioExtensionsLabel}. Maximo {maxAudioSizeLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            accept={`${allowedAudioTypes.join(",")},.mp3`}
            className="sr-only"
            disabled={isUploading}
            onChange={chooseFile}
            ref={inputRef}
            type="file"
          />
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-muted-mauve/25 bg-white px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <Music aria-hidden="true" className="size-4" />
            {audio ? "Reemplazar MP3" : "Elegir MP3"}
          </button>
        </div>
      </div>

      {selectedAudio ? (
        <div className="rounded-2xl border border-midnight-navy/10 bg-white p-3">
          <p className="truncate text-sm font-semibold text-midnight-navy">
            {selectedAudio.name}
          </p>
          <p className="mt-1 text-xs font-medium text-midnight-navy/62">
            {formatFileSize(selectedAudio.size)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-not-allowed disabled:bg-muted-mauve/45"
              disabled={isUploading}
              onClick={uploadSelectedAudio}
              type="button"
            >
              {isUploading ? "Subiendo..." : "Usar este MP3"}
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-midnight-navy/10 bg-white px-4 text-sm font-semibold text-midnight-navy/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isUploading}
              onClick={clearSelection}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid min-h-20 place-items-center rounded-2xl border border-dashed border-midnight-navy/14 bg-white px-4 text-center text-sm font-semibold text-midnight-navy/58">
          {audio ? "MP3 guardado para esta invitacion." : "Aun no hay MP3."}
        </div>
      )}

      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          status.error || error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {status.error ?? error ?? status.success ?? ""}
      </p>
    </div>
  );
}

function LocationImageUploader({
  eventId,
  image,
  locationKind,
  storyItemId,
  title,
  uploadPurpose = "location",
}: {
  eventId: string;
  image: LocationImagePreview | null;
  locationKind?: "Ceremonia" | "Lugar adicional" | "Recepcion";
  storyItemId?: string;
  title: string;
  uploadPurpose?: "location" | "story";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] =
    useState<SelectedLocationImage | null>(null);
  const [optimisticDeletedImageId, setOptimisticDeletedImageId] = useState<
    string | null
  >(null);
  const [status, setStatus] = useState<{ error?: string; success?: string }>(
    {},
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const isBusy = isUploading || isDeleting;
  const visibleImage =
    image?.id && image.id === optimisticDeletedImageId ? null : image;

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage.url);
      }
    };
  }, [selectedImage]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setStatus({});

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
    }

    if (!file) {
      setSelectedImage(null);
      return;
    }

    setSelectedImage({
      file,
      url: URL.createObjectURL(file),
    });
  }

  function clearSelection() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
    }

    setSelectedImage(null);
    setStatus({});
  }

  async function uploadSelectedImage() {
    if (!selectedImage || isBusy) {
      return;
    }

    const typeError = validateLocationImageType(selectedImage.file);

    if (typeError) {
      setStatus({ error: typeError });
      return;
    }

    setIsUploading(true);
    setStatus({ success: "Preparando imagen..." });

    const supabase = createClient();
    let uploadedObject:
      | {
          bucket: string;
          mimeType: string;
          objectPath: string;
          sizeBytes: number;
        }
      | null = null;

    try {
      const uploadFile = await optimizeLocationImageFile(selectedImage.file);
      const validationError = validateLocationImage(uploadFile);

      if (validationError) {
        throw new Error(validationError);
      }

      setStatus({ success: "Subiendo imagen..." });

      const prepared = await prepareInvitationImageUpload({
        eventId,
        fileName: uploadFile.name,
        ...(locationKind ? { locationKind } : {}),
        mimeType: uploadFile.type,
        purpose: uploadPurpose,
        sizeBytes: uploadFile.size,
        ...(storyItemId ? { storyItemId } : {}),
      });

      if ("error" in prepared) {
        throw new Error(prepared.error);
      }

      const { error } = await supabase.storage
        .from(prepared.bucket)
        .upload(prepared.objectPath, uploadFile, {
          contentType: uploadFile.type,
          upsert: false,
        });

      if (error) {
        throw new Error("No pudimos subir la imagen a Storage.");
      }

      uploadedObject = {
        bucket: prepared.bucket,
        mimeType: uploadFile.type,
        objectPath: prepared.objectPath,
        sizeBytes: uploadFile.size,
      };

      setStatus({ success: "Guardando en el borrador..." });

      const result = await finalizeInvitationImageUpload({
        eventId,
        ...(locationKind ? { locationKind } : {}),
        purpose: uploadPurpose,
        ...(storyItemId ? { storyItemId } : {}),
        uploads: [
          {
            mimeType: uploadedObject.mimeType,
            objectPath: uploadedObject.objectPath,
            sizeBytes: uploadedObject.sizeBytes,
          },
        ],
      });

      if (result.error) {
        throw new Error(result.error);
      }

      clearSelection();
      setStatus({ success: result.success ?? "Imagen guardada." });
      router.refresh();
    } catch (error) {
      if (uploadedObject) {
        await supabase.storage
          .from(uploadedObject.bucket)
          .remove([uploadedObject.objectPath]);
      }

      setStatus({
        error:
          error instanceof Error
            ? error.message
            : "No pudimos subir la imagen. Inténtalo nuevamente.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function deleteImage() {
    if (!visibleImage?.id || isBusy) {
      return;
    }

    const confirmed = window.confirm(
      "¿Quitar esta imagen del lugar? Si ya fue publicada, seguirá visible hasta que vuelvas a publicar.",
    );

    if (!confirmed) {
      return;
    }

    const previousImage = visibleImage;
    setOptimisticDeletedImageId(previousImage.id ?? null);
    setStatus({ success: "Imagen quitada del borrador." });
    startDeleteTransition(async () => {
      const result = await deleteInvitationImage(previousImage.id ?? "");

      if (result.error) {
        setOptimisticDeletedImageId(null);
        setStatus({ error: result.error });
        return;
      }

      setStatus({ success: result.success });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-midnight-navy/10 bg-porcelain/45 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-midnight-navy">{title}</p>
          <p className="mt-1 text-xs leading-5 text-midnight-navy/62">
            {allowedImageExtensionsLabel}. Máximo {maxImageSizeLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            accept={allowedImageTypes.join(",")}
            className="sr-only"
            disabled={isBusy}
            onChange={chooseFile}
            ref={inputRef}
            type="file"
          />
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-muted-mauve/25 bg-white px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            {visibleImage ? "Reemplazar" : "Elegir imagen"}
          </button>
          {visibleImage?.id ? (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/20 bg-white px-4 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isBusy}
              onClick={deleteImage}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Quitar
            </button>
          ) : null}
        </div>
      </div>

      {selectedImage || visibleImage?.url ? (
        <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <img
            alt=""
            className="aspect-[4/3] w-full rounded-2xl object-cover sm:w-36"
            src={selectedImage?.url ?? visibleImage?.url ?? ""}
          />
          <div className="min-w-0">
            {selectedImage ? (
              <>
                <p className="truncate text-sm font-semibold text-midnight-navy">
                  {selectedImage.file.name}
                </p>
                <p className="mt-1 text-xs font-medium text-midnight-navy/62">
                  {formatFileSize(selectedImage.file.size)}
                  {selectedImage.file.size > 1024 * 1024
                    ? " · Se optimizará antes de subir"
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-not-allowed disabled:bg-muted-mauve/45"
                    disabled={isBusy}
                    onClick={uploadSelectedImage}
                    type="button"
                  >
                    {isUploading ? "Procesando..." : "Usar esta imagen"}
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-midnight-navy/10 bg-white px-4 text-sm font-semibold text-midnight-navy/70 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isBusy}
                    onClick={clearSelection}
                    type="button"
                  >
                    <X aria-hidden="true" className="size-4" />
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm font-semibold text-midnight-navy">
                Imagen guardada para este lugar.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-midnight-navy/14 bg-white px-4 text-center text-sm font-semibold text-midnight-navy/58">
          Aún no hay imagen para este lugar.
        </div>
      )}

      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          status.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {status.error ?? status.success ?? ""}
      </p>
    </div>
  );
}

function getLocationImage(
  image?: InvitationLocation["image"],
): LocationImagePreview | null {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    return image
      ? {
          url: image,
        }
      : null;
  }

  if (!image.url) {
    return null;
  }

  return {
    id: image.id,
    name: image.alt,
    objectPath: image.objectPath,
    url: image.url,
  };
}

function getMusicAudioPreview(
  music: PersonalInvitationEvent["content"]["music"],
): MusicAudioPreview | null {
  if (!music) {
    return null;
  }

  if (music.audio && typeof music.audio !== "string") {
    return {
      id: music.audio.id,
      objectPath: music.audio.objectPath,
      url: music.audio.url,
    };
  }

  if (music.audioUrl) {
    return {
      url: music.audioUrl,
    };
  }

  return null;
}

function StoryImageUploader({
  eventId,
  image,
  storyItemId,
  title,
}: {
  eventId: string;
  image: LocationImagePreview | null;
  storyItemId: string;
  title: string;
}) {
  return (
    <LocationImageUploader
      eventId={eventId}
      image={image}
      storyItemId={storyItemId}
      title={title}
      uploadPurpose="story"
    />
  );
}

function getStoryImagePreview(item: EditorStoryItem): LocationImagePreview | null {
  if (!item.image) {
    return null;
  }

  if (typeof item.image === "string") {
    return {
      name: item.imageAlt,
      url: item.image,
    };
  }

  if (!item.image.url) {
    return null;
  }

  return {
    id: item.image.id,
    name: item.imageAlt ?? item.image.alt,
    objectPath: item.image.objectPath,
    url: item.image.url,
  };
}

function validateLocationImage(file: File) {
  const typeError = validateLocationImageType(file);

  if (typeError) {
    return typeError;
  }

  if (file.size > maxImageSizeBytes) {
    return `La imagen debe pesar máximo ${maxImageSizeLabel}.`;
  }

  return null;
}

function validateLocationImageType(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    return `Usa una imagen ${allowedImageExtensionsLabel}.`;
  }

  return null;
}

function validateMusicAudio(file: File) {
  if (!getMusicAudioMimeType(file)) {
    return "Usa un archivo MP3.";
  }

  if (file.size > maxAudioSizeBytes) {
    return `El MP3 debe pesar maximo ${maxAudioSizeLabel}.`;
  }

  return null;
}

function getMusicAudioMimeType(file: File) {
  if (allowedAudioTypes.includes(file.type)) {
    return file.type;
  }

  return file.name.toLowerCase().endsWith(".mp3") ? "audio/mpeg" : "";
}

const maxLocationUploadDimension = 1800;
const locationUploadQuality = 0.82;
const minOptimizationSizeBytes = 900 * 1024;

async function optimizeLocationImageFile(file: File): Promise<File> {
  if (file.size < minOptimizationSizeBytes) {
    return file;
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(
      1,
      maxLocationUploadDimension /
        Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/webp", locationUploadQuality);

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], replaceFileExtension(file.name, "webp"), {
      lastModified: Date.now(),
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pudimos preparar la imagen."));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function replaceFileExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");

  return `${baseName || "imagen"}.${extension}`;
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SaveFooter({
  canSubmit,
  state,
}: {
  canSubmit: boolean;
  state: UpdateContentState;
}) {
  const { pending } = useFormStatus();
  const statusMessage =
    pending
      ? "Guardando..."
      : state.error ?? state.success ?? "Sin cambios por guardar.";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {statusMessage}
      </p>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-not-allowed disabled:bg-muted-mauve/40"
        disabled={pending || !canSubmit}
        type="submit"
      >
        {pending ? "Guardando..." : "Guardar sección"}
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
const selectClassName = `${inputClassName} appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%238E6C88%22%20stroke-width=%222.2%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-11`;
const hourOptions = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const minuteOptions = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

type TimePeriod = "" | "AM" | "PM";

function parseTimeValue(value: string): {
  hour: string;
  minute: string;
  period: TimePeriod;
} {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    return {
      hour: "",
      minute: "",
      period: "",
    };
  }

  const hour24 = Number(match[1]);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    hour: String(hour12).padStart(2, "0"),
    minute: match[2],
    period,
  };
}

function formatTimeValue(hour: string, minute: string, period: TimePeriod) {
  if (!hour || !minute || !period) {
    return "";
  }

  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);

  if (
    !Number.isInteger(hourNumber) ||
    !Number.isInteger(minuteNumber) ||
    hourNumber < 1 ||
    hourNumber > 12 ||
    minuteNumber < 0 ||
    minuteNumber > 59
  ) {
    return "";
  }

  const hour24 =
    period === "AM"
      ? hourNumber === 12
        ? 0
        : hourNumber
      : hourNumber === 12
        ? 12
        : hourNumber + 12;

  return `${String(hour24).padStart(2, "0")}:${String(minuteNumber).padStart(
    2,
    "0",
  )}`;
}

function formatReadableTime(value: string) {
  const parsed = parseTimeValue(value);

  if (!parsed.hour || !parsed.minute || !parsed.period) {
    return "Sin hora definida";
  }

  return `${Number(parsed.hour)}:${parsed.minute} ${
    parsed.period === "AM" ? "a. m." : "p. m."
  }`;
}

function getStringValue(
  value: boolean | string | undefined,
  fallback: string,
) {
  return typeof value === "string" ? value : fallback;
}

function formatAvoidColors(
  colors:
    | Array<string | { name: string; value: string }>
    | undefined,
) {
  if (!colors?.length) {
    return "";
  }

  return colors
    .map((color) =>
      typeof color === "string"
        ? color
        : [color.name, color.value].filter(Boolean).join(" "),
    )
    .join("\n");
}
