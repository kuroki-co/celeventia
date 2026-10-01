create extension if not exists pgcrypto;

create schema if not exists private;

do $$
begin
  create type public.event_status as enum ('draft', 'ready', 'published', 'archived');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.invitation_recipient_status as enum (
    'not_shared',
    'shared',
    'opened',
    'confirmed',
    'declined'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.rsvp_response as enum ('confirmed', 'declined');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  couple_name text not null default 'Andrea & Diego',
  event_date_label text not null default '14 de noviembre de 2026',
  status public.event_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.invitation_recipients (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null,
  phone text,
  normalized_phone text,
  max_guests integer not null check (max_guests between 1 and 20),
  access_token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  share_status public.invitation_recipient_status not null default 'not_shared',
  shared_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  invitation_recipient_id uuid not null references public.invitation_recipients(id) on delete cascade,
  response public.rsvp_response not null,
  attendee_count integer not null default 0 check (attendee_count >= 0),
  attendee_names jsonb not null default '[]'::jsonb,
  responded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_recipient_id)
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function private.set_updated_at();

drop trigger if exists invitation_recipients_set_updated_at on public.invitation_recipients;
create trigger invitation_recipients_set_updated_at
before update on public.invitation_recipients
for each row execute function private.set_updated_at();

drop trigger if exists rsvps_set_updated_at on public.rsvps;
create trigger rsvps_set_updated_at
before update on public.rsvps
for each row execute function private.set_updated_at();

create or replace function private.has_event_access(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_members
    where event_id = p_event_id
      and user_id = (select auth.uid())
  );
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

  insert into public.events (owner_id, slug)
  values (current_user_id, generated_slug)
  returning id into found_event_id;

  insert into public.event_members (event_id, user_id, role)
  values (found_event_id, current_user_id, 'owner');

  return found_event_id;
end;
$$;

create or replace function public.resolve_public_invitation(p_slug text, p_token text)
returns table (
  event_id uuid,
  event_slug text,
  event_status public.event_status,
  couple_name text,
  event_date_label text,
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

create or replace function public.track_invitation_open(p_slug text, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_recipient_id uuid;
begin
  select ir.id
  into found_recipient_id
  from public.invitation_recipients ir
  join public.events e on e.id = ir.event_id
  where e.slug = p_slug
    and ir.access_token = p_token
    and e.status = 'published'
  limit 1;

  if found_recipient_id is null then
    return;
  end if;

  update public.invitation_recipients
  set
    first_opened_at = coalesce(first_opened_at, now()),
    last_opened_at = now(),
    share_status = case
      when share_status in ('confirmed', 'declined') then share_status
      else 'opened'::public.invitation_recipient_status
    end
  where id = found_recipient_id;
end;
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
begin
  if p_response not in ('confirmed', 'declined') then
    raise exception 'INVALID_RESPONSE';
  end if;

  normalized_response := p_response::public.rsvp_response;

  select e.id, ir.id, ir.max_guests
  into found_event_id, found_recipient_id, allowed_guests
  from public.invitation_recipients ir
  join public.events e on e.id = ir.event_id
  where e.slug = p_slug
    and ir.access_token = p_token
    and e.status = 'published'
  limit 1;

  if found_recipient_id is null then
    raise exception 'INVITATION_NOT_FOUND';
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

alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.invitation_recipients enable row level security;
alter table public.rsvps enable row level security;

drop policy if exists events_select_event_members on public.events;
create policy events_select_event_members
on public.events for select to authenticated
using (private.has_event_access(id));

drop policy if exists events_update_event_members on public.events;
create policy events_update_event_members
on public.events for update to authenticated
using (private.has_event_access(id))
with check (private.has_event_access(id));

drop policy if exists event_members_select_self on public.event_members;
create policy event_members_select_self
on public.event_members for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists invitation_recipients_select_event_members on public.invitation_recipients;
create policy invitation_recipients_select_event_members
on public.invitation_recipients for select to authenticated
using (private.has_event_access(event_id));

drop policy if exists invitation_recipients_insert_event_members on public.invitation_recipients;
create policy invitation_recipients_insert_event_members
on public.invitation_recipients for insert to authenticated
with check (private.has_event_access(event_id));

drop policy if exists invitation_recipients_update_event_members on public.invitation_recipients;
create policy invitation_recipients_update_event_members
on public.invitation_recipients for update to authenticated
using (private.has_event_access(event_id))
with check (private.has_event_access(event_id));

drop policy if exists invitation_recipients_delete_event_members on public.invitation_recipients;
create policy invitation_recipients_delete_event_members
on public.invitation_recipients for delete to authenticated
using (private.has_event_access(event_id));

drop policy if exists rsvps_select_event_members on public.rsvps;
create policy rsvps_select_event_members
on public.rsvps for select to authenticated
using (private.has_event_access(event_id));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select on public.event_members to authenticated;
grant select, insert, update, delete on public.invitation_recipients to authenticated;
grant select on public.rsvps to authenticated;
grant execute on function public.ensure_personal_event() to authenticated;
grant execute on function public.resolve_public_invitation(text, text) to anon, authenticated;
grant execute on function public.track_invitation_open(text, text) to anon, authenticated;
grant execute on function public.submit_public_rsvp(text, text, text, integer, text[]) to anon, authenticated;
