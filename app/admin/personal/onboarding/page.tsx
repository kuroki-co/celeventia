import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateEventForm } from "@/features/events/create-event/CreateEventForm";
import { OnboardingDesignStep } from "@/features/events/create-event/OnboardingDesignStep";
import { getPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { createClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  title: "Primer ingreso | Celeventia",
  description: "Configuración inicial de la invitación de boda.",
};

export default async function PersonalOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const event = await getPersonalInvitationEvent(supabase);

  if (event?.isConfigured) {
    redirect("/admin/personal");
  }

  return (
    <main className="min-h-dvh bg-porcelain px-4 py-8 text-near-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[22px] border border-midnight-navy/10 bg-white/86 px-5 py-6 shadow-[0_18px_56px_rgba(16,42,67,0.06)] sm:px-8 sm:py-8">
          {!event ? (
            <>
              <p className="text-xs font-semibold uppercase text-muted-mauve">
                Primer ingreso
              </p>
              <h1 className="mt-3 font-serif text-[2.65rem] font-semibold leading-none text-midnight-navy sm:text-[3.45rem]">
                Empecemos con su boda
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-midnight-navy/62">
                Solo necesitamos la identidad principal de la invitación. Los
                detalles finos vendran despues en el editor.
              </p>
              <CreateEventForm />
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase text-muted-mauve">
                Presentacion
              </p>
              <h1 className="mt-3 font-serif text-[2.65rem] font-semibold leading-none text-midnight-navy sm:text-[3.45rem]">
                Elijan como quieren presentarla
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-midnight-navy/62">
                {event.coupleName || "Su boda"} ·{" "}
                {event.eventDate ? event.dateLabel : "Fecha por definir"}
              </p>
              <OnboardingDesignStep event={event} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
