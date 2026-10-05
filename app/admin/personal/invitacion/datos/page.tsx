import type { Metadata } from "next";

import { InvitationEditorPage } from "@/features/invitations/update-content/InvitationEditorPage";

export const metadata: Metadata = {
  title: "Datos de la invitacion | Celeventia",
};

export default function WeddingDetailsPage() {
  return <InvitationEditorPage initialSection="datos" />;
}
