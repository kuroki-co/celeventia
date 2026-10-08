create or replace function public.song_suggestion_duplicate_exists(
  p_event_id uuid,
  p_song_title text,
  p_artist text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_song_suggestions ess
    where ess.event_id = p_event_id
      and lower(btrim(ess.song_title)) = lower(btrim(p_song_title))
      and lower(btrim(coalesce(ess.artist, ''))) =
        lower(btrim(coalesce(p_artist, '')))
  );
$$;

revoke all on function public.song_suggestion_duplicate_exists(uuid, text, text)
from public;
grant execute on function public.song_suggestion_duplicate_exists(uuid, text, text)
to anon, authenticated;
