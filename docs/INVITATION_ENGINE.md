# Invitation Engine

The single renderer is `invitation/renderer/WeddingInvitation.tsx`.

Dashboard preview and public invitations both render through `WeddingInvitation`; there is no separate public renderer. Themes and palettes remain defined in `invitation/themes.ts`, and the five existing visual themes are preserved. The palette catalog keeps the original eight IDs and adds `multicolor` as a ninth palette.

`WeddingInvitationEvent` and `WeddingInvitationContent` are presentation contracts. Persisted data is mapped explicitly in feature code before it reaches the renderer. The current draft mapping lives in `features/invitations/get-personal-invitation/data.ts`; public rendering receives the published snapshot via `features/rsvp/public-invitation/data.ts`.

Invitation typography is scoped to the renderer container with `next/font`
variables. The dashboard keeps Cormorant Garamond and Manrope. Public invitation
themes add a limited font set: Imperial Script and Cinzel for Classic, Cinzel and
Lora for Terra, Great Vibes and Lora for Versalles, and the existing
Cormorant/Manrope voice for Traditional and Elegant.

Preview no longer merges demo family, story, gifts, places or photos into real invitations. Optional sections render only when the saved content contains data for them.

The save-the-date section uses structured `eventDate`, `eventTimezone` and the main location time when available. Countdown and calendar download behavior lives in a small Client Component; if a snapshot lacks structured date fields, the static date label remains visible and the countdown is omitted.

The hero scroll affordance is a real anchor to the invitation details region,
with an accessible label and safe-area-aware placement.

Preview RSVP is a local simulation inside the shared renderer. It exercises yes/no, guest count, optional names, pending, error, success and modify states without calling `submit_public_rsvp` or mutating public data.

RSVP deadlines are stored on `events.rsvp_deadline`, included in published
snapshots and exposed by the public resolver as a display label plus closed
state. The public form hides/modification locks after closure, and
`submit_public_rsvp` enforces the same deadline server-side.

Location editing preserves the two primary places and can add one optional extra
place through the same `locations` array. The primary readiness check still
depends on the first real place, while the extra place may carry its own kind,
time, address, map URL and private Storage image.

The editor can manage the invitation program through the existing structured
`itinerary` array. Items keep an editor id, explicit order, optional time,
description, icon key and day offset; the renderer respects saved order instead
of sorting by hour.

The editor also manages optional family content through the existing legacy
family keys (`groomParents`, `brideParents`, `godparents`, `witnesses`) while
using neutral labels in the dashboard. Empty family groups are omitted from the
renderer instead of being filled with demo data.

Story editing uses the existing structured `story` array. The dashboard can add,
remove and reorder up to five moments with date/year, title and description.
Saved story moments can carry their own private Storage image reference; render
data resolves it to a short-lived URL, while text saves preserve existing images
instead of replacing them with demo assets or signed URLs.

Dress code editing supports the existing structured fields: general style,
general recommendations, optional men/women/children guidance and named
hex-color swatches to avoid. Empty guidance remains omitted in the renderer.

Gift editing supports the existing structured `gifts` array. The dashboard can
manage envelope copy, Yape, Plin, bank transfer and external registry details;
known methods are rebuilt from the form while unknown legacy methods are
preserved so older published content is not discarded during unrelated edits.

Music is optional and off by default. The dashboard asks for an MP3 upload,
stores the file as private `event-media` media under `events/{event_id}/music/`
and keeps a stable `bucket`/`objectPath`/media `id` reference in
`content.music.audio`. Render data resolves that reference to a signed
`audioUrl`; legacy direct audio URLs still render, but the editor no longer
asks users to paste one. The shared renderer shows a small client-side player
only when audio exists, starts playback only after a user gesture, and pauses
when the document is hidden.

Song suggestions are a separate optional section controlled by
`content.songSuggestions`. Public submissions use a focused Server Action and
the `event_song_suggestions` table; they do not mutate RSVP rows or the
published snapshot, and admins read them from the confirmations panel. Before
insert, the action checks for an existing suggestion with the same song and
artist through a narrow RPC instead of granting public row reads. Public
submissions require the song title and requester name; artist remains optional.

The collaborative album is optional and disabled by default through
`content.collaborativeAlbum`. Public uploads use a prepare/upload/finalize flow:
the browser uploads directly to private Storage under
`events/{event_id}/guest-album/`, finalization verifies the object metadata, and
admins moderate submissions as `pending`, `approved` or `rejected` from the
confirmations panel. The Server Actions apply a per-event volume guard before
reservation and final registration so a published album can reject bursts
without adding new infrastructure. The public form requires explicit permission
confirmation and the uploader's name before the browser uploads the selected
photo.

Original SVG assets under `public/wedding-themes` are used as runtime-safe
decorative masks: petal/leaf/sparkle particles, the rosette seal, and Terra /
Versalles line ornaments. They are decorative (`aria-hidden`) and color through
theme tokens rather than external SVG `currentColor` inheritance.

Section reveal is progressive enhancement. `InvitationSectionReveal` observes
renderer sections marked with `invitation-reveal-item`, reveals each once, and
keeps content visible when JavaScript or `IntersectionObserver` is unavailable.
Reduced-motion users receive the content without opacity/transform animation.
The same client island pauses decorative particle animation when the layer is
outside the viewport or the document is hidden. Particle counts are scoped by
theme and viewport: Classic/Versalles use eight desktop and four mobile items,
Terra uses six/three, Traditional uses four/two, and Elegant stays particle-free.

Invitation photos are stored as event-owned Supabase Storage objects. Draft content keeps stable references (`bucket`, `objectPath`, media `id`, order and focal point); render data resolves those references to short-lived URLs before passing them to `WeddingInvitation`. The renderer never needs to know Storage credentials, and published snapshots remain stable until the user explicitly republishes.

Gallery rendering sorts images by their saved `order` before applying the public display limit of 10 images. The dashboard uploader uses the same limit so new uploads are rejected before transfer when they would be hidden by the renderer.

Publication lifecycle:

1. Onboarding creates a draft event.
2. Editor actions update draft fields and increment `draft_revision`.
3. Readiness validates names, structured date, location/time/address/map, theme, palette, slug and main invitation text.
4. Publishing writes a complete `published_snapshot` and marks the event `published`.
5. Future edits remain draft-only until the user explicitly updates the published invitation.
