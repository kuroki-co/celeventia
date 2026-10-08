create table if not exists public.event_album_uploads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  bucket text not null default 'event-media',
  object_path text not null,
  uploader_name text,
  caption text,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create index if not exists event_album_uploads_event_created_idx
on public.event_album_uploads (event_id, created_at desc);

drop trigger if exists event_album_uploads_set_updated_at on public.event_album_uploads;
create trigger event_album_uploads_set_updated_at
before update on public.event_album_uploads
for each row execute function private.set_updated_at();

alter table public.event_album_uploads enable row level security;

drop policy if exists event_album_uploads_select_event_members
on public.event_album_uploads;
create policy event_album_uploads_select_event_members
on public.event_album_uploads for select to authenticated
using (
  exists (
    select 1
    from public.event_members em
    where em.event_id = event_album_uploads.event_id
      and em.user_id = auth.uid()
  )
);

drop policy if exists event_album_uploads_insert_public_enabled
on public.event_album_uploads;
create policy event_album_uploads_insert_public_enabled
on public.event_album_uploads for insert to anon, authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_album_uploads.event_id
      and e.status = 'published'
      and e.published_snapshot is not null
      and coalesce(
        (e.published_snapshot #>> '{content,collaborativeAlbum,enabled}')::boolean,
        false
      )
  )
);

drop policy if exists event_album_uploads_update_event_members
on public.event_album_uploads;
create policy event_album_uploads_update_event_members
on public.event_album_uploads for update to authenticated
using (
  exists (
    select 1
    from public.event_members em
    where em.event_id = event_album_uploads.event_id
      and em.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.event_members em
    where em.event_id = event_album_uploads.event_id
      and em.user_id = auth.uid()
  )
);

drop policy if exists event_media_storage_insert_public_album on storage.objects;
create policy event_media_storage_insert_public_album
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'events'
  and (storage.foldername(name))[3] = 'guest-album'
  and exists (
    select 1
    from public.events e
    where e.id = ((storage.foldername(name))[2])::uuid
      and e.status = 'published'
      and e.published_snapshot is not null
      and coalesce(
        (e.published_snapshot #>> '{content,collaborativeAlbum,enabled}')::boolean,
        false
      )
  )
);

grant select, update on public.event_album_uploads to authenticated;
grant insert on public.event_album_uploads to anon, authenticated;
