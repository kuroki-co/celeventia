import type { createClient } from "@/shared/supabase/server";
import type { PublicationReadiness } from "../evaluate-readiness/evaluatePublicationReadiness";
import type { PersonalInvitationEvent } from "../get-personal-invitation/data";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function syncPublicationStatus(
  supabase: SupabaseServerClient,
  event: PersonalInvitationEvent,
  readiness: PublicationReadiness,
) {
  if (event.status === "published" || event.status === "archived") {
    return event;
  }

  const nextStatus = readiness.ready ? "ready" : "draft";

  if (event.status === nextStatus) {
    return event;
  }

  const { error } = await supabase
    .from("events")
    .update({ status: nextStatus })
    .eq("id", event.id);

  if (error) {
    return event;
  }

  return {
    ...event,
    status: nextStatus,
  };
}
