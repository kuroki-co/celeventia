import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardPage } from "@/features/dashboard/main/DashboardPage";
import { getDashboardData } from "@/features/dashboard/main/data";
import { getPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { createClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  title: "Panel principal | Celeventia",
  description: "Guía de configuración de tu invitación en Celeventia.",
};

export default async function AdminPersonalPage() {
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

  const dashboardData = await getDashboardData(supabase, event);

  return <DashboardPage data={dashboardData} />;
}
