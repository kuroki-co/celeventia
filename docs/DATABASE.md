# Database

Core private tables:

- `events`: event identity, status, theme/palette, structured wedding names/date/time zone/city, draft `invitation_content`, draft revision and published snapshot.
- `event_members`: membership and authorization boundary. Every event-scoped private read or write is checked through membership/RLS.
- `invitation_recipients`: guest groups, passes, tokenized links and share/open state.
- `rsvps`: public RSVP responses constrained by recipient passes.
- `invitation_media`: event-owned media metadata for Supabase Storage objects.

Important functions:

- `get_personal_event_id()`: reads the authenticated user's first event without creating one.
- `create_personal_event(...)`: atomically creates the event and owner membership, using a transaction advisory lock to avoid duplicate weddings for concurrent first submissions.
- `ensure_personal_event()`: compatibility function that now fails when no event exists instead of creating demo data.
- `resolve_public_event(slug)` and `resolve_public_invitation_render(slug, token)`: return only published snapshot data.
- `track_invitation_open` and `submit_public_rsvp`: preserve token-based public invitation behavior.

Storage:

- Bucket: `event-media`, private.
- Paths:
  - `events/{event_id}/invitation/`
  - `events/{event_id}/gallery/`
  - `events/{event_id}/story/`
- Draft uploads store object metadata in `invitation_media`. Signed URLs are not stored as permanent source URLs.

The migration `202610050001_event_onboarding_invitation_content.sql` removes demo defaults for future event creation, adds structured wedding fields, adds invitation content/snapshot columns, creates media metadata and installs event-scoped Storage policies.
