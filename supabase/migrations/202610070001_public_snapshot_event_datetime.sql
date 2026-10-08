drop function if exists public.resolve_public_event(text);

create or replace function public.resolve_public_event(p_slug text)
returns table (
  event_id uuid,
  event_slug text,
  event_status public.event_status,
  couple_name text,
  event_date_label text,
  event_date text,
  event_timezone text,
  theme_id text,
  palette_id text,
  main_location_name text,
  main_location_time text,
  main_invitation_message text,
  invitation_content jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    e.id,
    e.slug,
    e.status,
    coalesce(e.published_snapshot->>'coupleName', e.couple_name),
    coalesce(e.published_snapshot->>'dateLabel', e.event_date_label),
    coalesce(e.published_snapshot->>'eventDate', e.event_date::text),
    coalesce(e.published_snapshot->>'eventTimezone', e.event_timezone),
    coalesce(e.published_snapshot->>'themeId', e.theme_id),
    coalesce(e.published_snapshot->>'paletteId', e.palette_id),
    coalesce(e.published_snapshot->>'mainLocationName', e.main_location_name),
    coalesce(e.published_snapshot->>'mainLocationTime', e.main_location_time),
    coalesce(e.published_snapshot->>'mainInvitationMessage', e.main_invitation_message),
    coalesce(e.published_snapshot->'content', '{}'::jsonb)
  from public.events e
  where e.slug = p_slug
    and e.status = 'published'
    and e.published_snapshot is not null
  limit 1;
$$;

drop function if exists public.resolve_public_invitation_render(text, text);

create or replace function public.resolve_public_invitation_render(p_slug text, p_token text)
returns table (
  event_id uuid,
  event_slug text,
  event_status public.event_status,
  couple_name text,
  event_date_label text,
  event_date text,
  event_timezone text,
  theme_id text,
  palette_id text,
  main_location_name text,
  main_location_time text,
  main_invitation_message text,
  invitation_content jsonb,
  recipient_id uuid,
  display_name text,
  max_guests integer,
  response public.rsvp_response,
  attendee_count integer,
  attendee_names jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    e.id,
    e.slug,
    e.status,
    coalesce(e.published_snapshot->>'coupleName', e.couple_name),
    coalesce(e.published_snapshot->>'dateLabel', e.event_date_label),
    coalesce(e.published_snapshot->>'eventDate', e.event_date::text),
    coalesce(e.published_snapshot->>'eventTimezone', e.event_timezone),
    coalesce(e.published_snapshot->>'themeId', e.theme_id),
    coalesce(e.published_snapshot->>'paletteId', e.palette_id),
    coalesce(e.published_snapshot->>'mainLocationName', e.main_location_name),
    coalesce(e.published_snapshot->>'mainLocationTime', e.main_location_time),
    coalesce(e.published_snapshot->>'mainInvitationMessage', e.main_invitation_message),
    coalesce(e.published_snapshot->'content', '{}'::jsonb),
    ir.id,
    ir.display_name,
    ir.max_guests,
    r.response,
    r.attendee_count,
    r.attendee_names
  from public.invitation_recipients ir
  join public.events e on e.id = ir.event_id
  left join public.rsvps r on r.invitation_recipient_id = ir.id
  where e.slug = p_slug
    and ir.access_token = p_token
    and e.status = 'published'
    and e.published_snapshot is not null;
$$;

grant execute on function public.resolve_public_event(text) to anon, authenticated;
grant execute on function public.resolve_public_invitation_render(text, text) to anon, authenticated;
