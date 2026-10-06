import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Check, Circle, Eye } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/features/dashboard/main/DashboardSidebar";
import { MobileDashboardNav } from "@/features/dashboard/main/MobileDashboardNav";
import { CopyPublicUrlButton } from "@/features/invitations/publish/CopyPublicUrlButton";
import { PublishInvitationForm } from "@/features/invitations/publish/PublishInvitationForm";
import { evaluatePublicationReadiness } from "@/features/invitations/evaluate-readiness/evaluatePublicationReadiness";
import { getPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { createClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  title: "Publicacion | Celeventia",
  description: "Checklist de publicacion de la invitacion.",
};

export default async function AdminInvitationPublishPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = `${protocol}://${host}`;
  const loadedEvent = await getPersonalInvitationEvent(supabase);
  if (!loadedEvent || !loadedEvent.isConfigured) {
    redirect("/admin/personal/onboarding");
  }

  const readiness = evaluatePublicationReadiness(loadedEvent);
  const event = loadedEvent;
  const publicHref = `/i/${event.slug}`;
  const publicUrl = `${origin}${publicHref}`;
  const isPublished = event.status === "published";

  return (
    <div className="min-h-dvh bg-porcelain text-near-black lg:flex">
      <DashboardSidebar
        activeHref="/admin/personal/invitacion/preview"
        coupleName={event.coupleName}
        dateLabel={event.dateLabel}
      />
      <div className="min-w-0 flex-1">
        <MobileDashboardNav
          activeHref="/admin/personal/invitacion/preview"
          invitationHref="/admin/personal/invitacion/preview"
        />
        <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6">
          <section className="rounded-[22px] border border-midnight-navy/10 bg-white px-5 py-5 shadow-[0_14px_42px_rgba(16,42,67,0.035)] sm:px-6">
            <p className="text-xs font-semibold uppercase text-muted-mauve">
              Publicacion
            </p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-serif text-[2.45rem] font-semibold leading-none text-midnight-navy sm:text-[3rem]">
                  Publica tu invitacion
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-midnight-navy/62">
                  Revisa los requisitos minimos antes de activar el enlace
                  publico y los envios por WhatsApp.
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-muted-mauve/20 px-4 text-sm font-semibold text-muted-mauve transition-colors hover:border-muted-mauve/35 hover:bg-muted-mauve/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
                href="/admin/personal/invitacion/preview"
              >
                <Eye aria-hidden="true" className="size-4" />
                Vista previa
              </Link>
            </div>
          </section>

          <section className="rounded-[22px] border border-midnight-navy/10 bg-white/80 px-5 py-5 shadow-[0_12px_34px_rgba(16,42,67,0.025)] sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-midnight-navy/45">
                  Checklist
                </p>
                <h2 className="mt-2 font-serif text-[2rem] font-semibold leading-tight text-midnight-navy">
                  {readiness.ready
                    ? "Lista para publicar"
                    : "Aun faltan requisitos"}
                </h2>
              </div>
              <p className="text-sm font-semibold text-midnight-navy/58">
                {readiness.requirements.length -
                  readiness.missingRequirements.length}
                /{readiness.requirements.length} completos
              </p>
            </div>

            <div className="mt-5 grid gap-2">
              {readiness.requirements.map((requirement) => (
                <Link
                  className="flex min-h-11 items-center gap-3 border-t border-midnight-navy/8 py-3 first:border-t-0"
                  href={requirement.href}
                  key={requirement.id}
                >
                  {requirement.complete ? (
                    <Check
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[#24523D]"
                    />
                  ) : (
                    <Circle
                      aria-hidden="true"
                      className="size-4 shrink-0 text-midnight-navy/32"
                    />
                  )}
                  <span className="text-sm font-semibold text-midnight-navy">
                    {requirement.label}
                  </span>
                  <span className="ml-auto text-xs font-semibold uppercase text-midnight-navy/45">
                    {requirement.complete ? "Completo" : "Pendiente"}
                  </span>
                </Link>
              ))}
            </div>

            {isPublished ? (
              <div className="mt-6 rounded-[18px] border border-[#24523D]/15 bg-[#24523D]/5 p-4">
                <p className="text-sm font-semibold text-[#24523D]">
                  Tu invitacion ya esta publicada.
                </p>
                <p className="mt-2 break-all text-sm leading-6 text-midnight-navy/62">
                  {publicUrl}
                </p>
                <CopyPublicUrlButton href={publicHref} publicUrl={publicUrl} />
                <PublishInvitationForm
                  disabled={!readiness.ready}
                  isPublished={isPublished}
                />
                {event.publishedRevision !== event.draftRevision ? (
                  <p className="mt-3 text-sm font-semibold text-muted-mauve">
                    Hay cambios sin publicar. Actualizar invitacion aplica el
                    borrador al mismo enlace.
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <p className="mt-6 max-w-2xl text-sm leading-6 text-midnight-navy/62">
                  La URL publica, los enlaces personalizados y WhatsApp quedan
                  bloqueados hasta que publiques.
                </p>
                <PublishInvitationForm disabled={!readiness.ready} />
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
