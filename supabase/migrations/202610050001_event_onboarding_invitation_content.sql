create extension if not exists pgcrypto;

alter table public.events
  add column if not exists partner_one_name text,
  add column if not exists partner_two_name text,
  add column if not exists name_order text not null default 'partner_one_first',
  add column if not exists event_date date,
  add column if not exists event_timezone text not null default 'America/Lima',
  add column if not exists city text,
  add column if not exists invitation_content jsonb not null default '{}'::jsonb,
  add column if not exists draft_revision integer not null default 1,
  add column if not exists published_revision integer,
  add column if not exists published_snapshot jsonb,
  add column if not exists is_configured boolean not null default false;

alter table public.events
  alter column couple_name drop default,
  alter column event_date_label drop default,
  alter column status set default 'draft',
  alter column theme_id set default 'versalles',
  alter column palette_id set default 'verde_esmeralda',
  alter column main_location_name drop default,
  alter column main_location_time drop default,
  alter column main_invitation_message drop default;

alter table public.events
  alter column couple_name drop not null,
  alter column event_date_label drop not null,
  alter column main_location_name drop not null,
  alter column main_location_time drop not null,
  alter column main_invitation_message drop not null;

alter table public.events
  drop constraint if exists events_name_order_check;

alter table public.events
  add constraint events_name_order_check
  check (name_order in ('partner_one_first', 'partner_two_first'));

create table if not exists public.invitation_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  bucket text not null,
  object_path text not null unique,
  purpose text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  width integer,
  height integer,
  alt_text text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists invitation_media_set_updated_at on public.invitation_media;
create trigger invitation_media_set_updated_at
before update on public.invitation_media
for each row execute function private.set_updated_at();

alter table public.invitation_media enable row level security;

drop policy if exists invitation_media_select_event_members on public.invitation_media;
create policy invitation_media_select_event_members
on public.invitation_media for select to authenticated
using (private.has_event_access(event_id));

drop policy if exists invitation_media_insert_event_members on public.invitation_media;
create policy invitation_media_insert_event_members
on public.invitation_media for insert to authenticated
with check (private.has_event_access(event_id));

drop policy if exists invitation_media_update_event_members on public.invitation_media;
create policy invitation_media_update_event_members
on public.invitation_media for update to authenticated
using (private.has_event_access(event_id))
with check (private.has_event_access(event_id));

drop policy if exists invitation_media_delete_event_members on public.invitation_media;
create policy invitation_media_delete_event_members
on public.invitation_media for delete to authenticated
using (private.has_event_access(event_id));

grant select, insert, update, delete on public.invitation_media to authenticated;

insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', false)
on conflict (id) do nothing;

drop policy if exists event_media_storage_select_event_members on storage.objects;
create policy event_media_storage_select_event_members
on storage.objects for select to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'events'
  and private.has_event_access(((storage.foldername(name))[2])::uuid)
);

drop policy if exists event_media_storage_insert_event_members on storage.objects;
create policy event_media_storage_insert_event_members
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'events'
  and private.has_event_access(((storage.foldername(name))[2])::uuid)
);

drop policy if exists event_media_storage_update_event_members on storage.objects;
create policy event_media_storage_update_event_members
on storage.objects for update to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'events'
  and private.has_event_access(((storage.foldername(name))[2])::uuid)
)
with check (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'events'
  and private.has_event_access(((storage.foldername(name))[2])::uuid)
);

drop policy if exists event_media_storage_delete_event_members on storage.objects;
create policy event_media_storage_delete_event_members
on storage.objects for delete to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'events'
  and private.has_event_access(((storage.foldername(name))[2])::uuid)
);

create or replace function public.get_personal_event_id()
returns uuid
language sql
security definer
set search_path = ''
as $$
  select em.event_id
  from public.event_members em
  where em.user_id = (select auth.uid())
  order by em.created_at asc
  limit 1;
$$;

create extension if not exists unaccent;

create or replace function private.slugify_event_names(p_first text, p_second text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(public.unaccent(coalesce(nullif(p_first, ''), 'boda') || '-' || coalesce(nullif(p_second, ''), 'celeventia'))),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

create or replace function public.create_personal_event(
  p_partner_one_name text,
  p_partner_two_name text,
  p_name_order text,
  p_event_date date,
  p_event_timezone text,
  p_city text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  found_event_id uuid;
  first_name text := trim(coalesce(p_partner_one_name, ''));
  second_name text := trim(coalesce(p_partner_two_name, ''));
  safe_order text := coalesce(nullif(p_name_order, ''), 'partner_one_first');
  ordered_first text;
  ordered_second text;
  base_slug text;
  generated_slug text;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if first_name = '' or second_name = '' then
    raise exception 'PARTNER_NAMES_REQUIRED';
  end if;

  if safe_order not in ('partner_one_first', 'partner_two_first') then
    raise exception 'INVALID_NAME_ORDER';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select em.event_id
  into found_event_id
  from public.event_members em
  where em.user_id = current_user_id
  order by em.created_at asc
  limit 1;

  if found_event_id is not null then
    return found_event_id;
  end if;

  if safe_order = 'partner_two_first' then
    ordered_first := second_name;
    ordered_second := first_name;
  else
    ordered_first := first_name;
    ordered_second := second_name;
  end if;

  base_slug := private.slugify_event_names(ordered_first, ordered_second);
  generated_slug := base_slug || '-' || lower(substring(encode(gen_random_bytes(3), 'hex'), 1, 6));

  insert into public.events (
    owner_id,
    slug,
    status,
    couple_name,
    event_date_label,
    partner_one_name,
    partner_two_name,
    name_order,
    event_date,
    event_timezone,
    city,
    theme_id,
    palette_id,
    invitation_content
  )
  values (
    current_user_id,
    generated_slug,
    'draft',
    ordered_first || ' & ' || ordered_second,
    case when p_event_date is null then 'Fecha por definir' else to_char(p_event_date, 'DD/MM/YYYY') end,
    first_name,
    second_name,
    safe_order,
    p_event_date,
    coalesce(nullif(p_event_timezone, ''), 'America/Lima'),
    nullif(trim(coalesce(p_city, '')), ''),
    'versalles',
    'verde_esmeralda',
    '{}'::jsonb
  )
  returning id into found_event_id;

  insert into public.event_members (event_id, user_id, role)
  values (found_event_id, current_user_id, 'owner');

  return found_event_id;
end;
$$;

create or replace function public.ensure_personal_event()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  found_event_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select public.get_personal_event_id() into found_event_id;

  if found_event_id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  return found_event_id;
end;
$$;

drop function if exists public.resolve_public_event(text);

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

grant execute on function public.get_personal_event_id() to authenticated;
grant execute on function public.create_personal_event(text, text, text, date, text, text) to authenticated;
grant execute on function public.ensure_personal_event() to authenticated;
grant execute on function public.resolve_public_event(text) to anon, authenticated;
grant execute on function public.resolve_public_invitation_render(text, text) to anon, authenticated;
