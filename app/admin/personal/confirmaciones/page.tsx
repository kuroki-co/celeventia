import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/features/dashboard/main/DashboardSidebar";
import { MobileDashboardNav } from "@/features/dashboard/main/MobileDashboardNav";
import { getRsvpResponses } from "@/features/rsvp/list-responses/data";
import { createClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  title: "Confirmaciones | Celeventia",
};

export default async function ConfirmationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  let data;

  try {
    data = await getRsvpResponses(supabase);
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
      redirect("/admin/personal/onboarding");
    }

    throw error;
  }

  return (
    <div className="min-h-dvh bg-porcelain text-near-black lg:flex">
      <DashboardSidebar
        activeHref="/admin/personal/confirmaciones"
        coupleName={data.event.coupleName}
        dateLabel={data.event.dateLabel}
      />
      <div className="min-w-0 flex-1">
        <MobileDashboardNav
          activeHref="/admin/personal/confirmaciones"
          invitationHref="/admin/personal/invitacion/preview"
        />
        <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">
          <section className="rounded-[22px] border border-midnight-navy/10 bg-white px-5 py-5 shadow-[0_14px_42px_rgba(16,42,67,0.035)] sm:px-6">
            <p className="text-xs font-semibold uppercase text-muted-mauve">
              RSVP
            </p>
            <h1 className="mt-3 font-serif text-[2.45rem] font-semibold leading-none text-midnight-navy sm:text-[3rem]">
              Confirmaciones
            </h1>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Grupos" value={data.summary.totalGroups} />
              <Metric label="Personas confirmadas" value={data.summary.confirmedPeople} />
              <Metric label="Grupos pendientes" value={data.summary.pendingGroups} />
            </div>
          </section>

          <section className="rounded-[22px] border border-midnight-navy/10 bg-white/82 p-5">
            <div className="grid gap-2">
              {data.responses.map((response) => (
                <article
                  className="rounded-[18px] border border-midnight-navy/10 bg-white px-4 py-4"
                  key={response.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-midnight-navy">
                        {response.displayName}
                      </h2>
                      <p className="mt-1 text-sm text-midnight-navy/58">
                        {response.response === "confirmed"
                          ? `${response.attendeeCount} asistentes`
                          : response.response === "declined"
                            ? "No asistira"
                            : "Pendiente"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase text-muted-mauve">
                      {response.shareStatus}
                    </span>
                  </div>
                  {response.attendeeNames.length ? (
                    <p className="mt-3 text-sm leading-6 text-midnight-navy/65">
                      {response.attendeeNames.join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-midnight-navy/10 bg-porcelain/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase text-midnight-navy/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-midnight-navy">{value}</p>
    </div>
  );
}
