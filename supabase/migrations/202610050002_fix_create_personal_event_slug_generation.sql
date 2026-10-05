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
  generated_slug := base_slug || '-' || lower(substring(encode(extensions.gen_random_bytes(3), 'hex'), 1, 6));

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

grant execute on function public.create_personal_event(text, text, text, date, text, text) to authenticated;
