import type { Metadata } from "next";

import { InvitationEditorPage } from "@/features/invitations/update-content/InvitationEditorPage";

export const metadata: Metadata = {
  title: "Fotografías de la invitación | Celeventia",
};

export default function InvitationPhotosPage() {
  return <InvitationEditorPage initialSection="fotografias" />;
}
