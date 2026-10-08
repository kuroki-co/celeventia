# Invitation QA

This file tracks evidence for the invitation-engine work requested by the
master prompt. It separates implemented/observed checks from items that still
need a real browser, staging event or device pass.

## Observed

- `pnpm exec tsc --noEmit` passes.
- `pnpm lint` passes.
- `pnpm build` passes on Next.js 16.3.5.
- `pnpm run test:calendar` passes with 8 Node tests covering:
  - structured event date/time with `America/Lima`;
  - missing time fallback to local day start;
  - invalid date rejection;
  - future/today/past countdown states;
  - ICS UTC conversion, CRLF, escaping and line folding;
  - Google Calendar URL date and field encoding.
- Supabase migrations applied remotely through `supabase db push --linked --yes`:
  - `202610070001_public_snapshot_event_datetime.sql`;
  - `202610070002_event_song_suggestions.sql`;
  - `202610070003_rsvp_deadline.sql`;
  - `202610070004_collaborative_album.sql`;
  - `202610070005_album_upload_limit_status.sql`;
  - `202610070006_song_suggestion_duplicate_check.sql`.

## Implemented But Not Fully Browser-Verified

- Shared renderer remains the single path for dashboard preview and public invitation.
- `multicolor` palette is present alongside the eight existing palette IDs.
- Entry replay uses the existing preview key path.
- Section reveal is progressive enhancement and respects reduced motion.
- Decorative particle counts are scoped by theme and viewport.
- Hero scroll affordance links to the details region instead of acting as dead decoration.
- Public RSVP preview is local simulation and does not call the public RSVP action.
- RSVP deadline is stored, published in snapshots and enforced by the public RPC.
- Song suggestions persist through a dedicated table and use a narrow duplicate-check RPC.
- Collaborative album uses private Storage, pending moderation, volume guard RPC, uploader name and permission confirmation.

## Pending External Verification

- Manual visual pass for 45 combinations: five themes times nine palettes.
- Mobile layouts at 320, 375, 390 and 430 px, plus tablet and desktop.
- iOS Safari and Android Chrome behavior, including safe areas and dynamic browser bars.
- Real staging RSVP flow with valid/invalid token, passes, modify response and closed deadline.
- Real staging album upload to Supabase Storage, invalid file rejection, limit handling and approve/reject moderation.
- Real staging song suggestion insert, duplicate rejection and admin visibility.
- Downloaded ICS imported into real calendar clients.
- Google Calendar link opened in a signed-in browser.
- Lighthouse/mobile performance, console and network pass.
- Final screenshots after assets and reveal states settle.
