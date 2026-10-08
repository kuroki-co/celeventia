# Database

Core private tables:

- `events`: event identity, status, theme/palette, structured wedding names/date/time zone/city, optional RSVP deadline, draft `invitation_content`, draft revision and published snapshot.
- `event_members`: membership and authorization boundary. Every event-scoped private read or write is checked through membership/RLS.
- `invitation_recipients`: guest groups, passes, tokenized links and share/open state.
- `rsvps`: public RSVP responses constrained by recipient passes.
- `invitation_media`: event-owned media metadata for Supabase Storage objects.
- `event_song_suggestions`: public song suggestions for published events that
  explicitly enable `content.songSuggestions.enabled`; authenticated event
  members can read them from the confirmations panel.
- `event_album_uploads`: guest photo submissions for published events that
  explicitly enable `content.collaborativeAlbum.enabled`; rows start as
  `pending`, can be changed to `approved` or `rejected` by authenticated event
  members, and are visible from the confirmations panel.

Important functions:

- `get_personal_event_id()`: reads the authenticated user's first event without creating one.
- `create_personal_event(...)`: atomically creates the event and owner membership, using a transaction advisory lock to avoid duplicate weddings for concurrent first submissions.
- `ensure_personal_event()`: compatibility function that now fails when no event exists instead of creating demo data.
- `resolve_public_event(slug)` and `resolve_public_invitation_render(slug, token)`: return only published snapshot data, including structured `event_date`, `event_timezone` and RSVP deadline metadata for countdown/calendar/RSVP rendering. Older snapshots fall back to the event columns through the resolver functions.
- `track_invitation_open` and `submit_public_rsvp`: preserve token-based public invitation behavior. `submit_public_rsvp` rejects writes after the published RSVP deadline.

Storage:

- Bucket: `event-media`, private.
- Paths:
  - `events/{event_id}/invitation/`
  - `events/{event_id}/gallery/`
  - `events/{event_id}/story/`
  - `events/{event_id}/music/`
  - `events/{event_id}/guest-album/`
- Draft uploads store object metadata in `invitation_media` and persistent media references in `events.invitation_content` using `bucket`, `objectPath` and media `id`.
- Dashboard image and music uploads reserve an event-scoped object path in a Server Action, upload bytes directly from the authenticated browser session to the private `event-media` bucket, and then finalize metadata/draft association in a second Server Action. This avoids sending 5 MB images, MP3 files or gallery batches through the Server Actions request body.
- Finalization verifies that the object exists under `events/{event_id}/...`, that Storage metadata matches the allowed MIME type and size, and cleans up uploaded objects when metadata insertion or draft association fails.
- Signed URLs are generated only at render time for dashboard preview/public invitations and are not stored as permanent source URLs.
- Published media is marked with `invitation_media.is_published = true` when publication writes `published_snapshot`, so removing or replacing draft photos does not break the public version.
- `202610050003_public_published_event_media_access.sql` adds a Storage select policy for `anon` limited to objects referenced by a published snapshot.
- `202610070002_event_song_suggestions.sql` adds event-owned song suggestions
  with RLS: event members can select rows, and public inserts are allowed only
  for published events whose snapshot enables song suggestions.
- `202610070003_rsvp_deadline.sql` adds `events.rsvp_deadline`, publishes it
  into snapshots, exposes deadline/closed state through the public resolver and
  enforces the same deadline in `submit_public_rsvp`.
- `202610070004_collaborative_album.sql` adds event-owned album uploads and a
  narrow Storage insert policy for `events/{event_id}/guest-album/*` only when
  the published snapshot enables the collaborative album. Event members can
  read and moderate upload rows through RLS; guest uploads remain private media
  objects surfaced through signed previews in the dashboard. Application Server
  Actions also apply per-event hourly and daily volume guards before reserving
  and finalizing public album uploads.
- `202610070005_album_upload_limit_status.sql` adds a narrow
  `album_upload_limit_status(event_id)` RPC so public upload actions can enforce
  those volume guards without granting public row reads on album submissions.
- `202610070006_song_suggestion_duplicate_check.sql` adds a narrow
  `song_suggestion_duplicate_exists(event_id, title, artist)` RPC so public song
  suggestions can do a basic duplicate check without granting public row reads.
- `202610070001_public_snapshot_event_datetime.sql` extends the public resolver functions with snapshot-aware structured date/time zone fields without exposing draft content.

The migration `202610050001_event_onboarding_invitation_content.sql` removes demo defaults for future event creation, adds structured wedding fields, adds invitation content/snapshot columns, creates media metadata and installs event-scoped Storage policies.
