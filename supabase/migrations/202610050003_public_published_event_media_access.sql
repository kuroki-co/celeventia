drop policy if exists event_media_storage_select_published_public on storage.objects;

create policy event_media_storage_select_published_public
on storage.objects for select to anon
using (
  bucket_id = 'event-media'
  and exists (
    select 1
    from public.events e
    where e.status = 'published'
      and e.published_snapshot is not null
      and position(name in e.published_snapshot::text) > 0
  )
);
