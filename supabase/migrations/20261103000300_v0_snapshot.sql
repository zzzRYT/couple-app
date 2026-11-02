-- rollback: restore space_snapshot from 20261102000100.
create or replace function public.space_snapshot(actor uuid, target uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare space public.couple_space%rowtype; room public.room_theme_version%rowtype; s public.prompt_session%rowtype;
begin
  select s2.* into space from public.couple_space s2 join public.space_member m on m.space_id=s2.id
    where s2.id=target and s2.status='active' and m.user_id=actor and m.space_active;
  if not found then return null; end if;
  room := public.current_room(target);
  s := public.latest_session(target);
  return jsonb_build_object(
    'space', jsonb_build_object('spaceId', space.id, 'status', space.status, 'anniversaryDate', space.anniversary_date,
      'timeZone', space.time_zone, 'updatedAt', space.updated_at, 'anniversaryChangedBy', space.anniversary_changed_by, 'anniversaryChangedAt', space.anniversary_changed_at,
      'memberCount', (select count(*) from public.space_member where space_id=target and space_active),
      'invitation', (select jsonb_build_object('status', case when i.expires_at <= public.app_now() and i.status='active' then 'expired' else i.status end, 'expiresAt', i.expires_at)
        from public.invitation i where i.space_id=target and i.status in ('active','accepted') order by i.created_at desc limit 1)),
    'members', (select jsonb_agg(jsonb_build_object('userId', m.user_id, 'aiConsentState', m.ai_consent_state, 'displayName', p.display_name, 'birthday', null, 'hasBirthday', false) order by m.joined_at)
      from public.space_member m left join public.user_profile p on p.user_id=m.user_id where m.space_id=target and m.space_active),
    'me', (select jsonb_build_object('userId', actor, 'displayName', p.display_name, 'birthday', case when p.birth_month is null then null else jsonb_build_object('month', p.birth_month, 'day', p.birth_day, 'year', p.birth_year) end) from (select actor as id) a left join public.user_profile p on p.user_id=a.id),
    'anniversaries', '[]'::jsonb,
    'features', jsonb_build_object('generation', false, 'generatedRender', false),
    'generatedObjects', '[]'::jsonb, 'homeCover', jsonb_build_object('status', 'none'),
    'versionNumber', room.version_number, 'sceneDocument', room.scene_document,
    'roomPresentation', room.room_presentation, 'roomThemeDocument', room.room_theme_document,
    'promptSession', public.session_json(s),
    'catalogVersion', (select max(catalog_version) from public.asset_catalog_entry),
    'serverTime', public.app_now());
end $$;
