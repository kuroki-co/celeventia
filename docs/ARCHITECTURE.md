# Celeventia Architecture

Celeventia is a single Next.js application organized as a modular monolith with pragmatic vertical slices.

The dashboard routes in `app/admin/personal/` compose pages, authentication checks and navigation. Business behavior lives in feature folders such as `features/events/create-event`, `features/invitations/update-content`, `features/invitations/publish`, `features/guests/*` and `features/rsvp/*`.

Server Components are the default. Client Components are used for interactive forms, collapsible editor sections and preview controls. Authenticated mutations use Server Actions and validate runtime input with Zod at the use-case boundary.

The personal MVP supports one commercial wedding flow per account, while data remains event-scoped through `event_id` and `event_members`. Reading dashboard pages does not create events. Event creation happens only through the onboarding action.

Publication uses a draft/published split:

- Draft fields live on `events` and `events.invitation_content`.
- Publishing writes a complete `published_snapshot` and `published_revision`.
- Public routes read only the published snapshot.
- Later edits update the draft until the user explicitly updates the published invitation.

No global repository/service layer is used. Supabase queries stay close to the feature that owns the use case.
