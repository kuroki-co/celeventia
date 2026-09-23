---
name: celeventia-architecture
description: Apply the agreed architecture and engineering rules for Celeventia. Use when designing, implementing, reviewing, refactoring, debugging, or extending the Celeventia codebase, especially Next.js, Supabase, invitations, events, guests, RSVP, media, themes, palettes, and database changes.
---

# Celeventia Architecture

Use this skill whenever working on the Celeventia MVP or future extensions of the same codebase.

The goal is to keep the project simple, modular, debuggable, and consistent while avoiding premature abstraction and code spaghetti.

## 1. Product context

Celeventia is a digital events platform.

The MVP begins with weddings and must be designed so the product can later support quinceañeros, anniversaries, birthdays, and other celebrations.

Current MVP scope:

- Public marketing landing.
- Authentication.
- Internal dashboard.
- One event context per authenticated workspace/account in the initial commercial workflow.
- Invitation creation and editing.
- Invitation live preview.
- Theme selection.
- Palette selection.
- Public invitation URL.
- Guest management.
- RSVP.
- Image/media uploads.
- Supabase-backed persistence.

The invitation system is the core product of the MVP.

The visual and functional reference for the first wedding invitation experience is the Festeja Bonito wedding playground, especially its Versalles layout, but Celeventia must use its own implementation, brand identity, components, interaction patterns, and code.

Do not copy third-party source code, assets, proprietary text, or exact layouts.

---

# 2. Technology stack

Use the following stack unless an explicit architectural decision changes it:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Zod
- Vercel

Prefer built-in Next.js capabilities before adding infrastructure.

Do not add Astro, NestJS, Express, a separate API server, microservices, queues, Redis, ORMs, or additional infrastructure unless there is a concrete requirement that justifies them.

---

# 3. Architectural style

Celeventia uses:

**Modular Monolith + Pragmatic Vertical Slice Architecture**

The application is one deployable Next.js application.

Organize business functionality by feature and use case, not by global technical layers.

Prefer:

```text
features/
  invitations/
    change-palette/
    update-content/
    publish/
```

Avoid:

```text
controllers/
services/
repositories/
schemas/
helpers/
```

as global folders for the entire application.

A feature should contain the code necessary to perform that use case.

Do not force every slice to contain the same number of files.

A simple CRUD action can be:

```text
UI
→ Server Action
→ Supabase
```

A more complex use case can be:

```text
UI
→ Server Action
→ Domain function
→ Data access
→ Supabase
```

Introduce additional layers only when they solve real complexity.

---

# 4. Core dependency direction

Prefer this flow:

```text
UI
↓
Server Action / Route Handler
↓
Use-case logic, if needed
↓
Supabase
```

Rules:

- UI components must not contain complex Supabase queries.
- Authorization must not rely only on UI visibility.
- Validate external input before persistence.
- Keep database access close to the vertical slice that owns the use case.
- Shared infrastructure belongs in `shared/`.
- Domain-specific code belongs in its feature.
- Do not create generic abstractions before at least two real use cases need them.

---

# 5. Recommended project structure

```text
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── precios/
│   │   └── ejemplos/
│   │
│   ├── (auth)/
│   │   └── login/
│   │
│   ├── (dashboard)/
│   │   └── dashboard/
│   │
│   └── i/
│       └── [slug]/
│
├── features/
│   ├── auth/
│   │
│   ├── events/
│   │   ├── create-event/
│   │   ├── get-event/
│   │   └── update-event/
│   │
│   ├── invitations/
│   │   ├── get-invitation/
│   │   ├── update-content/
│   │   ├── change-theme/
│   │   ├── change-palette/
│   │   ├── publish/
│   │   └── preview/
│   │
│   ├── guests/
│   │   ├── create-guest/
│   │   ├── update-guest/
│   │   └── list-guests/
│   │
│   ├── rsvp/
│   │   └── confirm-rsvp/
│   │
│   └── media/
│       ├── upload-image/
│       └── delete-image/
│
├── invitation/
│   ├── renderer/
│   ├── sections/
│   ├── themes/
│   └── palettes/
│
├── shared/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   │
│   ├── ui/
│   ├── errors/
│   ├── logging/
│   ├── validation/
│   ├── config/
│   └── utils/
│
└── types/
    └── database.types.ts
```

This structure is a guideline, not a rigid template.

If a feature is small, keep it small.

---

# 6. Next.js rules

## Server-first

Prefer Server Components by default.

Use `"use client"` only when the component genuinely requires:

- browser state,
- browser APIs,
- event handlers,
- live interaction,
- drag/drop,
- client-only preview controls.

Do not mark entire pages or layouts as client components just because one child is interactive.

## Server Actions

Use Server Actions for authenticated mutations initiated from the dashboard when appropriate.

Examples:

- update invitation content,
- change palette,
- change theme,
- create guest,
- publish invitation.

Use Route Handlers when an HTTP endpoint is materially useful, such as:

- public webhook,
- external integration,
- upload flow requiring an endpoint,
- API consumed outside the current Next.js app.

Do not create REST endpoints for internal actions by default.

## Marketing pages

Marketing pages should be statically rendered when their content allows it.

Prefer SSG for:

- homepage,
- pricing,
- examples,
- feature pages,
- FAQ.

Do not introduce a second frontend framework only for the landing unless future requirements justify it.

---

# 7. Supabase client rules

Maintain separate clients for separate execution environments.

```text
shared/supabase/
├── client.ts
├── server.ts
└── admin.ts
```

## `client.ts`

Use only when browser-side Supabase access is genuinely necessary.

Do not use it as the default.

## `server.ts`

Use for:

- Server Components,
- Server Actions,
- Route Handlers,
- authenticated server-side operations.

## `admin.ts`

Uses the Supabase service role.

Rules:

- Server only.
- Never import from Client Components.
- Never expose the service-role key.
- Use only for operations that truly require bypassing RLS.
- Prefer normal authenticated access with RLS whenever possible.

---

# 8. Database rules

PostgreSQL naming convention:

- tables: `snake_case`
- columns: `snake_case`
- foreign keys: `<entity>_id`

Examples:

```text
events
event_members
invitations
guests
rsvps
locations
schedule_items
story_items
gift_methods
gallery_items
```

Common columns when appropriate:

```text
id
event_id
created_at
updated_at
created_by
```

Use UUIDs for primary identifiers unless a concrete reason requires otherwise.

---

# 9. Event ownership and tenant boundary

`event_id` is the central ownership boundary of Celeventia.

Any data owned by an event should normally reference `event_id`.

Conceptually:

```text
events
├── invitations
├── guests
├── locations
├── schedule_items
├── story_items
├── gift_methods
├── gallery_items
└── rsvps
```

Never trust an `event_id` received from the browser without authorization.

Every event-scoped operation must confirm that the authenticated user is allowed to access the event.

Design the system so multiple events can coexist safely even if the MVP initially gives each client access to only one event.

Do not hard-code the assumption that the database will forever have one event per user.

---

# 10. Row Level Security

Enable RLS on private/event-scoped tables.

RLS answers:

> Is this user allowed to read or mutate this row?

RLS should not become the main place for business logic.

Prefer explicit policy names such as:

```text
events_select_event_members
events_update_event_members

guests_select_event_members
guests_insert_event_members
guests_update_event_members
```

Avoid vague names such as:

```text
policy1
allow_user
authenticated_access
```

Keep policies understandable and testable.

Do not bypass RLS with `service_role` simply because writing the correct policy is inconvenient.

---

# 11. Database migrations

All schema changes must be versioned through Supabase migrations.

Use:

```text
supabase/
├── migrations/
├── seed.sql
└── config.toml
```

Do not rely on undocumented manual production changes.

A migration should be:

- focused,
- reversible when practical,
- named clearly,
- committed with the feature that needs it.

Examples:

```text
20260922_create_events.sql
20260922_create_invitations.sql
20260923_add_event_rls.sql
```

Do not edit an already-applied production migration to change history.

Create a new migration.

---

# 12. Generated database types

Generate TypeScript types from the Supabase schema.

Store them in:

```text
src/types/database.types.ts
```

Use generated row/insert/update types when they represent persisted database structures.

Do not manually duplicate database types without a reason.

It is acceptable to create domain/view models when the UI or domain needs a shape different from the database row.

Database type != domain type != form type.

Do not force them to be identical.

---

# 13. Validation

Use Zod at application boundaries.

Validate:

- forms,
- URL parameters when needed,
- public RSVP payloads,
- uploads metadata,
- external API/webhook data,
- Server Action inputs.

Example flow:

```text
Form
↓
Zod
↓
Use case
↓
Supabase
```

Never assume TypeScript protects runtime input.

Prefer feature-owned schemas:

```text
features/invitations/change-palette/schema.ts
```

instead of one giant global schemas file.

---

# 14. Error handling

Do not leak raw Supabase/Postgres errors throughout the UI.

Translate infrastructure failures into meaningful application errors where useful.

Examples:

```text
EVENT_NOT_FOUND
EVENT_ACCESS_DENIED
INVITATION_NOT_FOUND
INVITATION_NOT_PUBLISHED
SLUG_ALREADY_EXISTS
GUEST_NOT_FOUND
INVALID_RSVP
STORAGE_UPLOAD_FAILED
```

Preserve the original error for logs.

User-visible messages should be understandable.

Developer logs should retain technical context.

---

# 15. Logging

Do not rely on random `console.log()` statements as the production debugging strategy.

Log structured context.

Example:

```ts
logger.error({
  action: "update_invitation",
  eventId,
  userId,
  invitationId,
  error,
})
```

Useful context may include:

```text
action
eventId
userId
invitationId
guestId
requestId
errorCode
```

Do not log:

- passwords,
- auth tokens,
- service-role keys,
- private payment credentials,
- sensitive guest data unnecessarily.

A future observability provider such as Sentry may be added without changing feature boundaries.

---

# 16. Storage organization

Supabase Storage stores event media and files.

Organize object paths by event.

Recommended pattern:

```text
events/
└── {event_id}/
    ├── invitation/
    │   ├── cover.webp
    │   └── couple/
    │
    ├── gallery/
    │
    ├── story/
    │
    └── documents/
```

Prefer generated unique filenames for user uploads when collisions are possible.

Store metadata in PostgreSQL when files are part of domain data.

Do not use Storage as a substitute for relational data.

Choose public/private buckets intentionally.

Use signed URLs for private assets when appropriate.

---

# 17. Media rules

For invitation images:

- validate MIME type,
- enforce size limits,
- prefer web-friendly formats,
- resize/compress when useful,
- avoid uploading huge originals when they are never needed.

Do not add video processing infrastructure in the MVP unless video becomes an approved requirement.

---

# 18. Invitation engine

The invitation renderer is a reusable subsystem.

Recommended structure:

```text
invitation/
├── renderer/
│   └── WeddingInvitation.tsx
│
├── sections/
│   ├── EnvelopeIntro.tsx
│   ├── Hero.tsx
│   ├── Family.tsx
│   ├── SaveTheDate.tsx
│   ├── Locations.tsx
│   ├── Schedule.tsx
│   ├── DressCode.tsx
│   ├── RSVP.tsx
│   ├── Gifts.tsx
│   ├── Gallery.tsx
│   ├── Songs.tsx
│   ├── Story.tsx
│   └── Closing.tsx
│
├── themes/
│   ├── versalles/
│   ├── classic/
│   └── terra/
│
└── palettes/
```

Do not duplicate an entire invitation for every palette.

Theme and palette are separate concepts.

Example:

```text
theme = versalles
palette = rojo_clasico
```

A theme defines visual structure and component styling.

A palette defines color tokens.

---

# 19. Preview and published invitation

This is a hard rule:

**The dashboard preview and the public invitation must use the same renderer.**

Conceptually:

```text
Dashboard Preview
       │
       ▼
WeddingInvitation
       ▲
       │
Public Invitation
```

Do not create separate implementations such as:

```text
PreviewInvitation.tsx
PublishedInvitation.tsx
```

that duplicate the invitation UI.

The preview may wrap the renderer in dashboard-specific controls, but the rendered invitation itself must be shared.

---

# 20. Theme design

Themes should provide visual variation without duplicating business logic.

Examples:

```text
versalles
classic
terra
```

Theme code may control:

- typography,
- spacing,
- ornamentation,
- layout variants,
- section presentation,
- image treatment,
- decorative elements.

Theme code must not own:

- RSVP persistence,
- guest permissions,
- event authorization,
- database access.

Keep presentation separate from application behavior.

---

# 21. Palette design

Define palettes as typed configuration.

Example:

```ts
export const redClassicPalette = {
  id: "red_classic",
  name: "Rojo Clásico",
  colors: {
    background: "...",
    surface: "...",
    primary: "...",
    secondary: "...",
    text: "...",
    muted: "...",
    accent: "...",
  },
} as const
```

Do not scatter hard-coded theme colors across components.

Prefer semantic tokens:

```text
background
surface
primary
secondary
text
muted
accent
border
```

over:

```text
red
darkRed
gold2
gray3
```

The invitation preview must update immediately when theme/palette configuration changes in the editor.

Persistence can happen separately from local preview state.

---

# 22. Invitation content model

Do not store the complete invitation as one unstructured HTML blob.

Prefer structured data.

Examples:

- couple information,
- event date,
- locations,
- schedule items,
- dress code,
- gift methods,
- gallery,
- story timeline,
- closing message.

Use relational tables for independently managed repeating data when useful.

Use JSONB when the data is naturally configuration-oriented and does not require heavy relational querying.

Choose intentionally.

Do not place everything into JSONB simply because it is convenient.

---

# 23. Public invitation routes

Recommended initial public route:

```text
/i/[slug]
```

Example:

```text
/i/andrea-y-diego
```

Slugs must be unique.

Do not expose sequential internal database IDs in public URLs.

Published invitations must be explicitly distinguishable from drafts.

Possible state:

```text
draft
published
archived
```

A draft must not accidentally become publicly accessible.

---

# 24. Authentication

Use Supabase Auth.

Authentication answers:

> Who is the user?

Authorization answers:

> What event/data can this user access?

Do not confuse them.

A valid session does not automatically authorize access to an event.

Use `event_members` or an equivalent relationship so the model can later support:

- owner,
- administrator,
- collaborator,
- planner,
- client.

Even if the MVP initially uses only one effective role, avoid schema choices that make future membership impossible.

---

# 25. UI rules

Use the Celeventia design system consistently.

Brand palette:

```text
Midnight Navy  #102A43
Muted Mauve    #8E6C88
Warm Sand      #D9B8A7
Porcelain      #F8F6F2
Near Black     #111111
```

Typography:

```text
Cormorant Garamond
Manrope
```

The dashboard should prioritize clarity over decorative styling.

The public invitation may be more expressive.

Do not use the Celeventia signature logo font as normal UI typography.

---

# 26. Dashboard editor

The invitation editor should eventually support:

- content editing,
- image upload,
- theme selection,
- palette selection,
- live preview,
- draft saving,
- publishing.

The editor UI is internal in the MVP.

Do not add commercial CTAs inside the internal editor such as:

- "Hablar con una asesora"
- "Reservar mi invitación"

Those belong to marketing experiences, not the internal creation workflow.

---

# 27. Performance

Do not optimize prematurely, but follow good defaults.

Marketing:

- static rendering where possible,
- optimized images,
- minimal client JavaScript.

Dashboard:

- server-first data loading,
- client state only where interactive,
- avoid unnecessary global state.

Invitations:

- optimize mobile first,
- lazy-load media below the fold where appropriate,
- avoid huge uncompressed assets,
- keep interaction smooth on mid-range phones.

Do not add caching infrastructure until there is a measured need.

---

# 28. State management

Use local React state for local UI concerns.

Use server/database state through Next.js and Supabase.

Do not introduce Redux, Zustand, or another global state library by default.

Add a state library only when there is a demonstrated cross-tree state problem that React composition/context cannot solve cleanly.

The live invitation editor may use local/context state for unsaved preview configuration.

---

# 29. Testing strategy

Prioritize tests around business-critical behavior.

High-value targets:

- event authorization,
- RLS policies,
- invitation publication,
- slug uniqueness,
- RSVP validation,
- theme/palette serialization,
- invitation renderer configuration,
- upload validation.

Avoid writing tests merely to increase coverage numbers.

Test behavior, not implementation details.

---

# 30. Database triggers and functions

Prefer application code for business workflows because it is easier to trace and debug.

Use database triggers/functions when the responsibility clearly belongs in PostgreSQL.

Good examples:

- maintaining `updated_at`,
- hard integrity guarantees,
- small deterministic database-level operations.

Avoid chains of hidden triggers implementing application workflows.

If a trigger exists, document it.

---

# 31. Avoid premature abstraction

Before creating a shared helper, base class, generic repository, generic CRUD service, or framework:

Ask:

1. Do at least two real use cases need this?
2. Does the abstraction remove meaningful duplication?
3. Does it make debugging easier rather than harder?
4. Can a new developer understand it quickly?

If not, keep the code local to the slice.

Prefer duplication of a few obvious lines over a confusing generic abstraction.

---

# 32. Avoid generic repository architecture

Do not create:

```text
BaseRepository<T>
GenericService<T>
CrudController<T>
```

for Supabase tables.

Celeventia's features have different authorization and business rules.

Prefer explicit feature code.

---

# 33. Coding conventions

Prefer:

- explicit names,
- small functions,
- early returns,
- typed inputs,
- typed outputs,
- feature-local code,
- predictable error paths.

Avoid:

- giant files,
- deeply nested conditionals,
- hidden side effects,
- magic strings,
- unclear abbreviations,
- unrelated helpers in `utils.ts`.

If `utils.ts` becomes a dumping ground, split it by purpose.

---

# 34. Change workflow

When implementing a new feature:

1. Identify the user-visible use case.
2. Identify the owning feature.
3. Create a vertical slice.
4. Define input validation.
5. Define authorization.
6. Add migration if persistence changes.
7. Implement server-side behavior.
8. Implement UI.
9. Add/update tests for critical behavior.
10. Update relevant architecture/database documentation.

Do not start by creating generic infrastructure.

---

# 35. Debugging workflow

When a feature fails, trace the slice vertically.

Example:

```text
PaletteSelector
↓
change-palette/action.ts
↓
validation
↓
authorization
↓
Supabase mutation
↓
database/RLS
```

Inspect the smallest relevant slice first.

Do not search random global services unless the failing code actually crosses them.

Log enough context to identify:

- user,
- event,
- action,
- affected entity,
- database error.

---

# 36. Documentation

Maintain these project documents as the architecture evolves:

```text
docs/
├── ARCHITECTURE.md
├── DATABASE.md
└── INVITATION_ENGINE.md
```

## `ARCHITECTURE.md`

Document:

- current architecture,
- folder structure,
- architectural decisions,
- significant tradeoffs.

## `DATABASE.md`

Document:

- tables,
- relationships,
- tenant/event ownership,
- RLS,
- Storage buckets,
- important functions/triggers.

## `INVITATION_ENGINE.md`

Document:

- renderer,
- sections,
- themes,
- palettes,
- preview,
- publication lifecycle.

The repository documentation is the source of truth for the current implementation.

This skill defines the engineering rules used to protect that architecture.

---

# 37. Architecture decisions

When a new decision materially changes architecture, document the reason.

Examples:

- adding an ORM,
- introducing a queue,
- separating the marketing application,
- adding a dedicated backend,
- changing authentication provider,
- introducing video processing,
- moving media storage,
- adding multi-region requirements.

Do not introduce major infrastructure silently.

---

# 38. MVP bias

Celeventia already has potential customers.

Optimize for:

- shipping,
- maintainability,
- debuggability,
- correctness,
- iteration speed.

Do not optimize for hypothetical millions of users before evidence requires it.

At the same time, do not sacrifice tenant isolation, authorization, migrations, or data integrity for speed.

---

# 39. Default decision rule

When multiple implementations are valid, prefer the solution that:

1. uses the current stack,
2. keeps code inside the owning vertical slice,
3. has the fewest moving parts,
4. preserves event isolation,
5. is easy to debug,
6. can be changed later without rewriting unrelated features.

---

# 40. Non-negotiable rules

These rules should be treated as architectural constraints unless explicitly changed:

- One Next.js application for the MVP.
- Supabase for PostgreSQL, Auth, and Storage.
- Modular monolith.
- Pragmatic vertical slices.
- `event_id` as the main event ownership boundary.
- RLS for private event-scoped data.
- Database schema changes through migrations.
- Runtime input validation with Zod.
- Generated Supabase database types.
- Service-role key is server-only.
- No complex Supabase queries inside UI components.
- Dashboard preview and public invitation share the same invitation renderer.
- Themes and palettes are configuration, not duplicated invitation implementations.
- Avoid unnecessary global service/repository layers.
- Avoid microservices and additional infrastructure without a concrete requirement.
