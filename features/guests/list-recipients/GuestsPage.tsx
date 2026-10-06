import { CreateRecipientForm } from "../create-recipient/CreateRecipientForm";
import { GuestsList } from "./GuestsList";
import type { GuestsPageData } from "./types";

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
              Gestion de invitados
            </p>
            <h1 className="mt-2 font-serif text-[2.35rem] font-semibold leading-none text-midnight-navy sm:text-[2.75rem]">
              Invitados
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-midnight-navy/62">
              Crea invitados o familias, comparte enlaces personalizados y
              revisa sus confirmaciones.
            </p>
          </div>
          <p className="text-sm font-semibold text-midnight-navy/62">
            {data.recipients.length} invitados
          </p>
        </div>
      </section>

      <CreateRecipientForm />

      <section className="rounded-[22px] border border-midnight-navy/10 bg-white/75 px-5 py-5 shadow-[0_12px_34px_rgba(16,42,67,0.025)] sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-mauve">
              Invitados
            </p>
            <h2 className="mt-2 font-serif text-[1.9rem] font-semibold leading-tight text-midnight-navy">
              Invitaciones personalizadas
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-5 text-midnight-navy/62">
            Cada invitado o familia tendra su enlace y sus pases.
          </p>
        </div>

        <div className="mt-5">
          <GuestsList
            isPublished={data.event.status === "published"}
            recipients={data.recipients}
          />
        </div>
      </section>
    </>
  );
}
