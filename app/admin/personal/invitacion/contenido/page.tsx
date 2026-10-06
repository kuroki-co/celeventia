import type { Metadata } from "next";

import { InvitationEditorPage } from "@/features/invitations/update-content/InvitationEditorPage";

export const metadata: Metadata = {
  title: "Contenido de la invitación | Celeventia",
};

export default function InvitationContentPage() {
  return <InvitationEditorPage initialSection="contenido" />;
}
