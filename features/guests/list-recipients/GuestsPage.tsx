import { CreateRecipientForm } from "../create-recipient/CreateRecipientForm";
import { RecipientShareActions } from "../share-via-whatsapp/RecipientShareActions";
import {
  getRecipientStatusClassName,
  getRecipientStatusLabel,
  getRecipientStatusMark,
} from "./status";
import type { GuestsPageData, InvitationRecipient } from "./types";

type GuestsPageProps = {
  data: GuestsPageData;
};

export function GuestsPage({ data }: GuestsPageProps) {
  return (
    <>
      <section className="rounded-[22px] border border-midnight-navy/10 bg-white px-5 py-5 shadow-[0_14px_42px_rgba(16,42,67,0.035)] sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-mauve">
              Gestión de invitados
            </p>
            <h1 className="mt-2 font-serif text-[2.35rem] font-semibold leading-none text-midnight-navy sm:text-[2.75rem]">
              Invitados
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-midnight-navy/62">
              Crea destinatarios, comparte enlaces personalizados y revisa sus
              confirmaciones.
            </p>
          </div>
          <p className="text-sm font-semibold text-midnight-navy/62">
            {data.recipients.length} destinatarios
          </p>
        </div>
      </section>

      <CreateRecipientForm />

      <section className="rounded-[22px] border border-midnight-navy/10 bg-white/75 px-5 py-5 shadow-[0_12px_34px_rgba(16,42,67,0.025)] sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-mauve">
              Destinatarios
            </p>
            <h2 className="mt-2 font-serif text-[1.9rem] font-semibold leading-tight text-midnight-navy">
              Invitaciones personalizadas
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-5 text-midnight-navy/62">
            Cada enlace contiene un token opaco y respeta los pases asignados.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {data.recipients.length ? (
            data.recipients.map((recipient) => (
              <RecipientCard
                isPublished={data.event.status === "published"}
                key={recipient.id}
                recipient={recipient}
              />
            ))
          ) : (
            <div className="rounded-[18px] border border-midnight-navy/10 bg-white p-5">
              <p className="text-sm font-semibold text-midnight-navy">
                Aún no hay destinatarios.
              </p>
              <p className="mt-1 text-sm leading-6 text-midnight-navy/62">
                Crea el primero para generar su enlace personalizado.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function RecipientCard({
  isPublished,
  recipient,
}: {
  isPublished: boolean;
  recipient: InvitationRecipient;
}) {
  return (
    <article className="rounded-[18px] border border-midnight-navy/10 bg-white p-4 transition-colors hover:border-muted-mauve/22">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-midnight-navy">
            {recipient.displayName}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-midnight-navy/62">
            <span>
              {recipient.maxGuests}{" "}
              {recipient.maxGuests === 1 ? "pase" : "pases"}
            </span>
            {recipient.normalizedPhone ? (
              <span>{recipient.normalizedPhone}</span>
            ) : (
              <span>Sin teléfono</span>
            )}
            {recipient.attendeeCount ? (
              <span>
                {recipient.attendeeCount}{" "}
                {recipient.attendeeCount === 1 ? "asistente" : "asistentes"}
              </span>
            ) : null}
          </div>
          <p
            className={[
              "mt-3 flex items-center gap-2 text-sm font-semibold",
              getRecipientStatusClassName(recipient.shareStatus),
            ].join(" ")}
          >
            <span aria-hidden="true">
              {getRecipientStatusMark(recipient.shareStatus)}
            </span>
            {getRecipientStatusLabel(recipient.shareStatus)}
          </p>
          {recipient.attendeeNames.length ? (
            <p className="mt-2 text-sm leading-5 text-midnight-navy/58">
              {recipient.attendeeNames.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="lg:min-w-[360px]">
          <RecipientShareActions
            isInvitationPublished={isPublished}
            recipient={recipient}
          />
        </div>
      </div>
    </article>
  );
}
