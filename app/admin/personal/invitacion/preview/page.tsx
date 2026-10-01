import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InvitationPreviewPage } from "@/features/invitations/preview/InvitationPreviewPage";
import { getPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { createClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  title: "Vista previa | Celeventia",
  description: "Vista previa y personalizacion visual de la invitacion.",
};

export default async function AdminInvitationPreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const event = await getPersonalInvitationEvent(supabase);

  return <InvitationPreviewPage event={event} />;
}
