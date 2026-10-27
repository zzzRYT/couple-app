-- rollback: Drop these functions; they only read and write existing user_profile columns.
create function public.get_preferences(actor uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_build_object('locale', locale, 'uiTheme', ui_theme) from public.user_profile where user_id=actor),
    '{"locale":null,"uiTheme":"system"}'::jsonb);
$$;
create function public.set_preferences(actor uuid, new_locale text, new_theme text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if new_locale is not null and new_locale not in ('ko-KR','en-US','ja-JP') then raise exception 'INVALID_REQUEST'; end if;
  if new_theme is null or new_theme not in ('system','light','dark') then raise exception 'INVALID_REQUEST'; end if;
  insert into public.user_profile (user_id, locale, ui_theme) values (actor, new_locale, new_theme)
    on conflict (user_id) do update set locale=excluded.locale, ui_theme=excluded.ui_theme, updated_at=public.app_now();
  return public.get_preferences(actor);
end $$;
revoke all on function public.get_preferences(uuid), public.set_preferences(uuid,text,text) from public, anon, authenticated;
grant execute on function public.get_preferences(uuid), public.set_preferences(uuid,text,text) to service_role;
