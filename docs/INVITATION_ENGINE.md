# Invitation Engine

The single renderer is `invitation/renderer/WeddingInvitation.tsx`.

Dashboard preview and public invitations both render through `WeddingInvitation`; there is no separate public renderer. Themes and palettes remain defined in `invitation/themes.ts`, and the five existing visual themes are preserved.

`WeddingInvitationEvent` and `WeddingInvitationContent` are presentation contracts. Persisted data is mapped explicitly in feature code before it reaches the renderer. The current draft mapping lives in `features/invitations/get-personal-invitation/data.ts`; public rendering receives the published snapshot via `features/rsvp/public-invitation/data.ts`.

Preview no longer merges demo family, story, gifts, places or photos into real invitations. Optional sections render only when the saved content contains data for them.

Invitation photos are stored as event-owned Supabase Storage objects. Draft content keeps stable references (`bucket`, `objectPath`, media `id`, order and focal point); render data resolves those references to short-lived URLs before passing them to `WeddingInvitation`. The renderer never needs to know Storage credentials, and published snapshots remain stable until the user explicitly republishes.

Publication lifecycle:

1. Onboarding creates a draft event.
2. Editor actions update draft fields and increment `draft_revision`.
3. Readiness validates names, structured date, location/time/address/map, theme, palette, slug and main invitation text.
4. Publishing writes a complete `published_snapshot` and marks the event `published`.
5. Future edits remain draft-only until the user explicitly updates the published invitation.
