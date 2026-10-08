alter table public.events
add column if not exists rsvp_deadline date;

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
  rsvp_deadline text,
  rsvp_deadline_label text,
  is_rsvp_closed boolean,
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
    coalesce(e.published_snapshot->>'rsvpDeadline', e.rsvp_deadline::text),
    case
      when coalesce(e.published_snapshot->>'rsvpDeadline', e.rsvp_deadline::text) is null then null
      else to_char(
        coalesce(e.published_snapshot->>'rsvpDeadline', e.rsvp_deadline::text)::date,
        'DD/MM/YYYY'
      )
    end,
    case
      when coalesce(e.published_snapshot->>'rsvpDeadline', e.rsvp_deadline::text) is null then false
      else (
        (now() at time zone coalesce(e.published_snapshot->>'eventTimezone', e.event_timezone, 'America/Lima'))::date
        > coalesce(e.published_snapshot->>'rsvpDeadline', e.rsvp_deadline::text)::date
      )
    end,
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

create or replace function public.submit_public_rsvp(
  p_slug text,
  p_token text,
  p_response text,
  p_attendee_count integer,
  p_attendee_names text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_event_id uuid;
  found_recipient_id uuid;
  allowed_guests integer;
  safe_count integer;
  safe_names jsonb;
  normalized_response public.rsvp_response;
  found_rsvp_deadline date;
  found_timezone text;
begin
  if p_response not in ('confirmed', 'declined') then
    raise exception 'INVALID_RESPONSE';
  end if;

  normalized_response := p_response::public.rsvp_response;

  select e.id, ir.id, ir.max_guests,
    coalesce(e.published_snapshot->>'rsvpDeadline', e.rsvp_deadline::text)::date,
    coalesce(e.published_snapshot->>'eventTimezone', e.event_timezone, 'America/Lima')
  into found_event_id, found_recipient_id, allowed_guests, found_rsvp_deadline, found_timezone
  from public.invitation_recipients ir
  join public.events e on e.id = ir.event_id
  where e.slug = p_slug
    and ir.access_token = p_token
    and e.status = 'published'
    and e.published_snapshot is not null
  limit 1;

  if found_recipient_id is null then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  if found_rsvp_deadline is not null
    and (now() at time zone found_timezone)::date > found_rsvp_deadline then
    raise exception 'RSVP_CLOSED';
  end if;

  if normalized_response = 'declined' then
    safe_count := 0;
    safe_names := '[]'::jsonb;
  else
    safe_count := greatest(1, coalesce(p_attendee_count, 1));

    if safe_count > allowed_guests then
      raise exception 'ATTENDEE_COUNT_EXCEEDS_PASSES';
    end if;

    safe_names := to_jsonb(coalesce(p_attendee_names, array[]::text[]));
  end if;

  insert into public.rsvps (
    event_id,
    invitation_recipient_id,
    response,
    attendee_count,
    attendee_names,
    responded_at
  )
  values (
    found_event_id,
    found_recipient_id,
    normalized_response,
    safe_count,
    safe_names,
    now()
  )
  on conflict (invitation_recipient_id)
  do update set
    response = excluded.response,
    attendee_count = excluded.attendee_count,
    attendee_names = excluded.attendee_names,
    responded_at = now();

  update public.invitation_recipients
  set share_status = case
    when normalized_response = 'confirmed' then 'confirmed'::public.invitation_recipient_status
    else 'declined'::public.invitation_recipient_status
  end
  where id = found_recipient_id;
end;
$$;

grant execute on function public.resolve_public_event(text) to anon, authenticated;
grant execute on function public.resolve_public_invitation_render(text, text) to anon, authenticated;
grant execute on function public.submit_public_rsvp(text, text, text, integer, text[]) to anon, authenticated;
