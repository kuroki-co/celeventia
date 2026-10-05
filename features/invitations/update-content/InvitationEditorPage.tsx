import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/features/dashboard/main/DashboardSidebar";
import { MobileDashboardNav } from "@/features/dashboard/main/MobileDashboardNav";
import { getPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { createClient } from "@/shared/supabase/server";

import { InvitationContentEditor } from "./InvitationContentEditor";

type InvitationEditorPageProps = {
  initialSection: "datos" | "contenido" | "fotografias";
};

export async function InvitationEditorPage({
  initialSection,
}: InvitationEditorPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const event = await getPersonalInvitationEvent(supabase);

  if (!event || !event.isConfigured) {
    redirect("/admin/personal/onboarding");
  }

  return (
    <div className="min-h-dvh bg-porcelain text-near-black lg:flex">
      <DashboardSidebar coupleName={event.coupleName} dateLabel={event.dateLabel} />
      <div className="min-w-0 flex-1">
        <MobileDashboardNav
          activeHref="/admin/personal/invitacion/contenido"
          invitationHref="/admin/personal/invitacion/preview"
        />
        <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">
          <section className="rounded-[22px] border border-midnight-navy/10 bg-white px-5 py-5 shadow-[0_14px_42px_rgba(16,42,67,0.035)] sm:px-6">
            <p className="text-xs font-semibold uppercase text-muted-mauve">
              Editor
            </p>
            <h1 className="mt-3 font-serif text-[2.45rem] font-semibold leading-none text-midnight-navy sm:text-[3rem]">
              Configura tu invitacion
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-midnight-navy/62">
              Guarda cada seccion del borrador. La version publica no cambia
              hasta usar la accion de actualizacion en Publicacion.
            </p>
          </section>
          <InvitationContentEditor
            event={event}
            initialSection={initialSection}
          />
        </main>
      </div>
    </div>
  );
}
