alter table public.events
  add column if not exists published_at timestamptz,
  add column if not exists theme_id text not null default 'versalles',
  add column if not exists palette_id text not null default 'verde_esmeralda',
  add column if not exists main_location_name text not null default 'Parroquia San Jose',
  add column if not exists main_location_time text not null default '5:00 p.m.',
  add column if not exists main_invitation_message text not null default 'Nos encantaria compartir este dia con ustedes y celebrar juntos nuestra boda.';

alter table public.events
  alter column status set default 'draft';

create or replace function public.ensure_personal_event()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  found_event_id uuid;
  generated_slug text;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select event_id
  into found_event_id
  from public.event_members
  where user_id = current_user_id
  order by created_at asc
  limit 1;

  if found_event_id is not null then
    return found_event_id;
  end if;

  generated_slug := 'andrea-diego-' || substring(replace(current_user_id::text, '-', ''), 1, 8);

  insert into public.events (
    owner_id,
    slug,
    status,
    theme_id,
    palette_id,
    main_location_name,
    main_location_time,
    main_invitation_message
  )
  values (
    current_user_id,
    generated_slug,
    'draft',
    'versalles',
    'verde_esmeralda',
    'Parroquia San Jose',
    '5:00 p.m.',
    'Nos encantaria compartir este dia con ustedes y celebrar juntos nuestra boda.'
  )
  returning id into found_event_id;

  insert into public.event_members (event_id, user_id, role)
  values (found_event_id, current_user_id, 'owner');

  return found_event_id;
end;
$$;

create or replace function public.resolve_public_event(p_slug text)
returns table (
  event_id uuid,
  event_slug text,
  event_status public.event_status,
  couple_name text,
  event_date_label text,
  theme_id text,
  palette_id text,
  main_location_name text,
  main_location_time text,
  main_invitation_message text
)
language sql
security definer
set search_path = ''
as $$
  select
    e.id,
    e.slug,
    e.status,
    e.couple_name,
    e.event_date_label,
    e.theme_id,
    e.palette_id,
    e.main_location_name,
    e.main_location_time,
    e.main_invitation_message
  from public.events e
  where e.slug = p_slug
    and e.status = 'published'
  limit 1;
$$;

create or replace function public.resolve_public_invitation_render(p_slug text, p_token text)
returns table (
  event_id uuid,
  event_slug text,
  event_status public.event_status,
  couple_name text,
  event_date_label text,
  theme_id text,
  palette_id text,
  main_location_name text,
  main_location_time text,
  main_invitation_message text,
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
    e.couple_name,
    e.event_date_label,
    e.theme_id,
    e.palette_id,
    e.main_location_name,
    e.main_location_time,
    e.main_invitation_message,
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
    and e.status = 'published';
$$;

grant execute on function public.resolve_public_event(text) to anon, authenticated;
grant execute on function public.resolve_public_invitation_render(text, text) to anon, authenticated;
