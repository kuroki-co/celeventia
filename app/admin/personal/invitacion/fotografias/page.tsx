import type { Metadata } from "next";

import { InvitationEditorPage } from "@/features/invitations/update-content/InvitationEditorPage";

export const metadata: Metadata = {
  title: "Fotografias de la invitacion | Celeventia",
};

export default function InvitationPhotosPage() {
  return <InvitationEditorPage initialSection="fotografias" />;
}
