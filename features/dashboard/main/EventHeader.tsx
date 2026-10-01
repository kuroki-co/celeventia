import Link from "next/link";

import { getInvitationStatusLabel } from "./status";
import type {
  DashboardEvent,
  InvitationSummary,
  SetupProgress,
  SetupStep,
} from "./types";

type EventHeaderProps = {
  event: DashboardEvent;
  invitation: InvitationSummary;
  nextStep?: SetupStep;
  progress: SetupProgress;
};

export function EventHeader({
  event,
  invitation,
  nextStep,
  progress,
}: EventHeaderProps) {
  const statusLabel = getInvitationStatusLabel(invitation.status);
  const ctaLabel =
    invitation.status === "published" ? "Ver invitación" : "Vista previa";
  const ctaHref =
    invitation.status === "published" && invitation.publicHref
      ? invitation.publicHref
      : invitation.previewHref;

  return (
    <section className="rounded-[22px] border border-midnight-navy/10 bg-white px-5 py-3.5 shadow-[0_14px_42px_rgba(16,42,67,0.035)] sm:px-6 sm:py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-mauve">
            Resumen del evento
          </p>
          <h1 className="mt-1.5 font-serif text-[2.5rem] font-medium leading-none text-midnight-navy sm:text-[2.75rem]">
            {event.coupleName}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-midnight-navy/72">
            {event.dateLabel}
          </p>
          <p className="mt-0.5 text-sm leading-5 text-midnight-navy/62">
            {event.description}
          </p>
        </div>

        <Link
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-xl border border-midnight-navy/10 px-4 text-sm font-semibold text-midnight-navy/72 transition-colors hover:border-muted-mauve/35 hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-muted-mauve"
          href={ctaHref}
        >
          {ctaLabel}
        </Link>
      </div>

      <div className="mt-3 border-t border-midnight-navy/10 pt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-midnight-navy/45">
              {statusLabel}
            </p>
            <p className="mt-0.5 text-sm font-medium text-midnight-navy/68">
              {progress.completed} de {progress.total} pasos completados
            </p>
          </div>

          {nextStep ? (
            <p className="max-w-md text-sm leading-6 text-midnight-navy/62">
              Siguiente:{" "}
              <span className="font-semibold text-muted-mauve">
                {nextStep.title}
              </span>
            </p>
          ) : null}
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-warm-sand/18">
          <div
            className="h-full rounded-full bg-muted-mauve"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </section>
  );
}
