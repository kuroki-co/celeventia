create table if not exists public.event_song_suggestions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  song_title text not null check (char_length(song_title) between 1 and 140),
  artist text check (artist is null or char_length(artist) <= 140),
  requester_name text check (requester_name is null or char_length(requester_name) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists event_song_suggestions_event_created_idx
on public.event_song_suggestions (event_id, created_at desc);

alter table public.event_song_suggestions enable row level security;

drop policy if exists event_song_suggestions_select_event_members
on public.event_song_suggestions;
create policy event_song_suggestions_select_event_members
on public.event_song_suggestions for select to authenticated
using (
  exists (
    select 1
    from public.event_members em
    where em.event_id = event_song_suggestions.event_id
      and em.user_id = auth.uid()
  )
);

drop policy if exists event_song_suggestions_insert_published_public
on public.event_song_suggestions;
create policy event_song_suggestions_insert_published_public
on public.event_song_suggestions for insert to anon, authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_song_suggestions.event_id
      and e.status = 'published'
      and e.published_snapshot is not null
      and coalesce(
        (e.published_snapshot #>> '{content,songSuggestions,enabled}')::boolean,
        false
      )
  )
);

grant select on public.event_song_suggestions to authenticated;
grant insert on public.event_song_suggestions to anon, authenticated;
