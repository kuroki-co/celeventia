import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicAlbumUploadForm } from "@/features/album/submit-photo/PublicAlbumUploadForm";
import { getPublicInvitation } from "@/features/rsvp/public-invitation/data";
import { PublicSongSuggestionForm } from "@/features/music/suggest-song/PublicSongSuggestionForm";
import { PublicRsvpForm } from "@/features/rsvp/public-invitation/PublicRsvpForm";
import { WeddingInvitation } from "@/invitation/renderer/WeddingInvitation";
import { createClient } from "@/shared/supabase/server";

type PublicInvitationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Invitacion | Celeventia",
  description: "Invitación personalizada y confirmación de asistencia.",
};

export default async function PublicInvitationPage({
  params,
  searchParams,
}: PublicInvitationPageProps) {
  const { slug } = await params;
  const { t } = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;
  const supabase = await createClient();
  const data = await getPublicInvitation(supabase, slug, token);

  if (!data) {
    notFound();
  }

  const rsvpData =
    token && data.recipient && data.rsvp
      ? {
          ...data,
          recipient: data.recipient,
          rsvp: data.rsvp,
          token,
        }
      : null;

  return (
    <WeddingInvitation
      event={data.event}
      mode="public"
      recipient={data.recipient}
      collaborativeAlbumSlot={
        data.event.collaborativeAlbum?.enabled ? (
          <PublicAlbumUploadForm
            config={data.event.collaborativeAlbum}
            slug={slug}
          />
        ) : null
      }
      songSuggestionsSlot={
        data.event.songSuggestions?.enabled ? (
          <PublicSongSuggestionForm
            config={data.event.songSuggestions}
            slug={slug}
          />
        ) : null
      }
    >
      {rsvpData ? (
        <PublicRsvpForm data={rsvpData} slug={slug} token={rsvpData.token} />
      ) : null}
    </WeddingInvitation>
  );
}
