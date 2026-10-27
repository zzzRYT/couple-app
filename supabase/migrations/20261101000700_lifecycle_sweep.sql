-- deletion-policy: This function only deletes transient prompt data on the documented schedule (24 hours unapplied, 30 days applied); dropping it stops cleanup but deletes nothing.
create function public.sweep_prompt_data(at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare expired integer; stranded integer; unapplied integer; applied integer;
begin
  -- Previews past their validity become expired; requests stuck in queued (worker crash) release their quota slot.
  update public.decoration_request set state='expired' where state='previewed' and expires_at <= at;
  get diagnostics expired = row_count;
  with stuck as (update public.decoration_request set state='failed', failure_code='GENERATION_FAILED'
      where state='queued' and created_at <= at - interval '10 minutes' returning id)
    update public.daily_request_reservation set status='released' where request_id in (select id from stuck) and status='reserved';
  get diagnostics stranded = row_count;
  delete from public.prompt_message m where m.created_at <= at - interval '24 hours'
    and not exists (select 1 from public.decoration_request d where d.id=m.decoration_request_id and d.state='applied');
  delete from public.decoration_request d where d.state <> 'applied' and d.created_at <= at - interval '24 hours';
  get diagnostics unapplied = row_count;
  delete from public.prompt_message m where m.created_at <= at - interval '30 days';
  update public.decoration_request set prompt_text=null where state='applied' and prompt_text is not null and created_at <= at - interval '30 days';
  get diagnostics applied = row_count;
  return jsonb_build_object('expired', expired, 'released', stranded, 'deletedUnapplied', unapplied, 'clearedApplied', applied);
end $$;
revoke all on function public.sweep_prompt_data(timestamptz) from public, anon, authenticated;
grant execute on function public.sweep_prompt_data(timestamptz) to service_role;
