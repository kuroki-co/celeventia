create or replace function public.album_upload_limit_status(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  hourly_count integer;
  daily_count integer;
begin
  if not exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.status = 'published'
      and e.published_snapshot is not null
      and coalesce(
        (e.published_snapshot #>> '{content,collaborativeAlbum,enabled}')::boolean,
        false
      )
  ) then
    return 'unavailable';
  end if;

  select count(*)::integer
  into hourly_count
  from public.event_album_uploads eau
  where eau.event_id = p_event_id
    and eau.created_at >= now() - interval '1 hour';

  if hourly_count >= 40 then
    return 'hourly_limit';
  end if;

  select count(*)::integer
  into daily_count
  from public.event_album_uploads eau
  where eau.event_id = p_event_id
    and eau.created_at >= now() - interval '24 hours';

  if daily_count >= 120 then
    return 'daily_limit';
  end if;

  return 'ok';
end;
$$;

revoke all on function public.album_upload_limit_status(uuid) from public;
grant execute on function public.album_upload_limit_status(uuid) to anon, authenticated;
