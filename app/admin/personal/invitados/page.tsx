import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/features/dashboard/main/DashboardSidebar";
import { MobileDashboardNav } from "@/features/dashboard/main/MobileDashboardNav";
import { getGuestsPageData } from "@/features/guests/list-recipients/data";
import { GuestsPage } from "@/features/guests/list-recipients/GuestsPage";
import { createClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  title: "Invitados | Celeventia",
  description: "Gestiona destinatarios, enlaces personalizados y RSVP.",
};

export default async function AdminGuestsPage() {
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
  const data = await getGuestsPageData(supabase, `${protocol}://${host}`);
  const invitationHref = `/i/${data.event.slug}`;

  return (
    <div className="min-h-dvh bg-porcelain text-near-black lg:flex">
      <DashboardSidebar
        activeHref="/admin/personal/invitados"
        coupleName={data.event.coupleName}
        dateLabel={data.event.dateLabel}
      />
      <div className="min-w-0 flex-1">
        <MobileDashboardNav
          activeHref="/admin/personal/invitados"
          invitationHref={invitationHref}
        />
        <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-5">
          <GuestsPage data={data} />
        </main>
      </div>
    </div>
  );
}
