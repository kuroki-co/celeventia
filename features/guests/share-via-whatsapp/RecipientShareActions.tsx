"use client";

import { Copy, MessageCircle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import type { InvitationRecipient } from "../list-recipients/types";
import { toWhatsAppPhone } from "../create-recipient/phone";
import { markRecipientShared } from "./action";

type RecipientShareActionsProps = {
  isInvitationPublished: boolean;
  recipient: InvitationRecipient;
};

export function RecipientShareActions({
  isInvitationPublished,
  recipient,
}: RecipientShareActionsProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const defaultMessage = useMemo(
    () => getDefaultMessage(recipient.displayName, recipient.publicLink),
    [recipient.displayName, recipient.publicLink],
  );
  const [message, setMessage] = useState(defaultMessage);
  const canUsePublicLink = isInvitationPublished;
  const canUseWhatsApp =
    isInvitationPublished && Boolean(recipient.normalizedPhone);

  async function copyLink() {
    if (!canUsePublicLink) {
      return;
    }

    await navigator.clipboard.writeText(recipient.publicLink);
    setCopyStatus("Enlace copiado");
    window.setTimeout(() => setCopyStatus(""), 2200);
  }

  function openWhatsApp() {
    if (!recipient.normalizedPhone) {
      return;
    }

    const text = encodeURIComponent(message);
    const phone = toWhatsAppPhone(recipient.normalizedPhone);

    startTransition(async () => {
      await markRecipientShared(recipient.id);
    });

    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener");
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-muted-mauve/20 px-4 text-sm font-semibold text-muted-mauve transition-colors hover:border-muted-mauve/35 hover:bg-muted-mauve/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve disabled:cursor-not-allowed disabled:border-midnight-navy/10 disabled:text-midnight-navy/38"
          disabled={!canUseWhatsApp}
          onClick={() => setIsSharing((value) => !value)}
          type="button"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          WhatsApp
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-midnight-navy/10 px-4 text-sm font-semibold text-midnight-navy/68 transition-colors hover:border-muted-mauve/25 hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve disabled:cursor-not-allowed disabled:text-midnight-navy/38"
          disabled={!canUsePublicLink}
          onClick={copyLink}
          type="button"
        >
          <Copy aria-hidden="true" className="size-4" />
          Copiar enlace
        </button>
        <span
          aria-live="polite"
          className="min-h-10 text-sm font-medium leading-10 text-[#24523D]"
        >
          {copyStatus}
        </span>
      </div>

      {!isInvitationPublished ? (
        <p className="mt-2 text-sm leading-5 text-midnight-navy/52">
          Publica la invitacion para habilitar enlaces publicos y WhatsApp.
        </p>
      ) : !canUseWhatsApp ? (
        <p className="mt-2 text-sm leading-5 text-midnight-navy/52">
          Agrega un teléfono para abrir WhatsApp. El enlace personalizado se
          puede copiar igual.
        </p>
      ) : null}

      {isSharing && canUseWhatsApp ? (
        <div className="mt-4 rounded-[18px] border border-warm-sand/35 bg-warm-sand/10 p-4">
          <label className="block">
            <span className="text-sm font-semibold text-midnight-navy">
              Mensaje editable
            </span>
            <textarea
              className="mt-2 min-h-[150px] w-full resize-y rounded-2xl border border-midnight-navy/10 bg-white px-4 py-3 text-sm leading-6 text-midnight-navy outline-none transition-colors focus:border-muted-mauve"
              onChange={(event) => setMessage(event.target.value)}
              value={message}
            />
          </label>
          <p className="mt-3 break-all text-xs font-medium text-midnight-navy/54">
            {recipient.publicLink}
          </p>
          <button
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7D5F78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve disabled:cursor-wait disabled:bg-muted-mauve/55"
            disabled={isPending}
            onClick={openWhatsApp}
            type="button"
          >
            {isPending ? "Preparando..." : "Abrir WhatsApp"}
          </button>
          <p className="mt-2 text-xs leading-5 text-midnight-navy/52">
            Celeventia registrará que abriste WhatsApp, no que el mensaje fue
            entregado o leído.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function getDefaultMessage(displayName: string, publicLink: string) {
  return [
    `Hola, ${displayName}`,
    "",
    "Queremos compartir con ustedes nuestra invitación de boda.",
    "Nos encantará contar con su presencia en este día tan especial.",
    "",
    "Aquí pueden ver todos los detalles y confirmar su asistencia:",
    "",
    publicLink,
  ].join("\n");
}
