-- Roles, responsibilities and duties.
-- Run this ONCE in Supabase → SQL Editor → New query (empty the box first), then click Run.
-- Run it after schema.sql and prayer-update.sql. It only adds to the database; running it again is safe.
--
-- The pastor creates church roles (Usher, Media Team, Treasurer …), writes what each is responsible for,
-- and chooses what each role may do in the app. Duties are tasks given to a person or to everyone in a role.

-- =========================================================
-- Tables
-- =========================================================
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  description text not null default '',
  permissions text[] not null default '{}' check (permissions <@ array[
    'manage_people', 'assign_duties', 'announce_all', 'manage_events', 'manage_sermons',
    'prayer_meetings', 'view_prayer_report', 'view_reports', 'manage_members', 'moderate_board']::text[]),
  created_at timestamptz not null default now()
);

create table if not exists public.position_members (
  position_id uuid not null references public.positions(id) on delete cascade,
  uid uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (position_id, uid)
);

create table if not exists public.duties (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  details text not null default '',
  assigned_to uuid references public.profiles(id) on delete cascade,
  position_id uuid references public.positions(id) on delete cascade,
  due_date date,
  status text not null default 'open' check (status in ('open', 'done')),
  done_at timestamptz,
  done_by_name text not null default '',
  created_by uuid default auth.uid(),
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  check (assigned_to is not null or position_id is not null)
);

create index if not exists position_members_uid on public.position_members (uid);
create index if not exists duties_assigned_to on public.duties (assigned_to);

-- =========================================================
-- Permission check used by every rule below
-- =========================================================
create or replace function public.has_perm(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select is_pastor() or exists (
    select 1 from position_members pm join positions p on p.id = pm.position_id
    where pm.uid = auth.uid() and perm = any(p.permissions))
$$;

-- =========================================================
-- Who can see and change roles and duties
-- =========================================================
alter table public.positions enable row level security;
alter table public.position_members enable row level security;
alter table public.duties enable row level security;

drop policy if exists "positions: members read" on public.positions;
create policy "positions: members read" on public.positions for select to authenticated using (has_profile());
drop policy if exists "positions: pastor manages" on public.positions;
create policy "positions: pastor manages" on public.positions for all to authenticated using (is_pastor()) with check (is_pastor());

drop policy if exists "position_members: members read" on public.position_members;
create policy "position_members: members read" on public.position_members for select to authenticated using (has_profile());
drop policy if exists "position_members: people managers assign" on public.position_members;
create policy "position_members: people managers assign" on public.position_members for all to authenticated
  using (has_perm('manage_people')) with check (has_perm('manage_people'));

create or replace function public.in_position(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from position_members where position_id = p and uid = auth.uid())
$$;

drop policy if exists "duties: assignee or manager reads" on public.duties;
create policy "duties: assignee or manager reads" on public.duties for select to authenticated using (
  assigned_to = auth.uid() or (position_id is not null and in_position(position_id)) or created_by = auth.uid() or has_perm('assign_duties'));
drop policy if exists "duties: managers add" on public.duties;
create policy "duties: managers add" on public.duties for insert to authenticated with check (has_perm('assign_duties') and created_by = auth.uid());
drop policy if exists "duties: managers edit" on public.duties;
create policy "duties: managers edit" on public.duties for update to authenticated using (has_perm('assign_duties')) with check (has_perm('assign_duties'));
drop policy if exists "duties: managers delete" on public.duties;
create policy "duties: managers delete" on public.duties for delete to authenticated using (has_perm('assign_duties') or created_by = auth.uid());

-- The person (or anyone in the role) marks a duty done or not done.
create or replace function public.complete_duty(d uuid, done boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  du duties;
begin
  select * into du from duties where id = d;
  if not found then raise exception 'Duty not found'; end if;
  if not (du.assigned_to = auth.uid() or (du.position_id is not null and in_position(du.position_id)) or has_perm('assign_duties')) then
    raise exception 'This duty is not yours';
  end if;
  update duties set status = case when done then 'done' else 'open' end,
    done_at = case when done then now() else null end,
    done_by_name = case when done then coalesce((select name from profiles where id = auth.uid()), '') else '' end
  where id = d;
end $$;

-- =========================================================
-- Extra permissions on existing data (added alongside the existing rules)
-- =========================================================
-- People managers can see and edit everyone's profile.
drop policy if exists "profiles: people managers read" on public.profiles;
create policy "profiles: people managers read" on public.profiles for select to authenticated using (has_perm('manage_people') or has_perm('assign_duties'));
drop policy if exists "profiles: people managers edit" on public.profiles;
create policy "profiles: people managers edit" on public.profiles for update to authenticated using (has_perm('manage_people')) with check (has_perm('manage_people'));

-- Only the pastor can make someone pastor or change a pastor. People managers can set member/leader and bacenta.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.group_id is distinct from old.group_id
      or new.email is distinct from old.email or new.id <> old.id) and not public.has_perm('manage_people') then
    raise exception 'Only the pastor can change roles or bacentas';
  end if;
  if not public.is_pastor() and (new.role = 'pastor' or old.role = 'pastor') and new.role is distinct from old.role then
    raise exception 'Only the pastor can make someone a pastor';
  end if;
  return new;
end $$;

create or replace function public.set_role(target uuid, new_role text, new_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not has_perm('manage_people') then raise exception 'Only the pastor can change roles'; end if;
  if new_role not in ('member', 'leader', 'pastor') then raise exception 'Unknown role'; end if;
  if target = auth.uid() then new_role := (select role from profiles where id = target); end if; -- nobody changes their own access level
  if not is_pastor() and (new_role = 'pastor' or (select role from profiles where id = target) = 'pastor') then
    raise exception 'Only the pastor can make someone a pastor';
  end if;
  update profiles set role = new_role, group_id = new_group where id = target;
  update groups set leader_id = null, leader_name = ''
    where leader_id = target and (new_role <> 'leader' or id is distinct from new_group);
  if new_role = 'leader' and new_group is not null then
    update groups set leader_id = target, leader_name = (select name from profiles where id = target) where id = new_group;
  end if;
end $$;

drop policy if exists "members: member managers" on public.members;
create policy "members: member managers" on public.members for all to authenticated using (has_perm('manage_members')) with check (has_perm('manage_members'));
drop policy if exists "followups: member managers read" on public.followups;
create policy "followups: member managers read" on public.followups for select to authenticated using (has_perm('manage_members'));
drop policy if exists "followups: member managers add" on public.followups;
create policy "followups: member managers add" on public.followups for insert to authenticated with check (has_perm('manage_members') and by = auth.uid());

drop policy if exists "attendance: report viewers read" on public.attendance;
create policy "attendance: report viewers read" on public.attendance for select to authenticated using (has_perm('view_reports'));
drop policy if exists "reports: report viewers read" on public.reports;
create policy "reports: report viewers read" on public.reports for select to authenticated using (has_perm('view_reports'));

drop policy if exists "announcements: announcers read" on public.announcements;
create policy "announcements: announcers read" on public.announcements for select to authenticated using (has_perm('announce_all'));
drop policy if exists "announcements: announcers post" on public.announcements;
create policy "announcements: announcers post" on public.announcements for insert to authenticated with check (has_perm('announce_all') and by = auth.uid());
drop policy if exists "announcements: announcers delete" on public.announcements;
create policy "announcements: announcers delete" on public.announcements for delete to authenticated using (has_perm('announce_all'));

drop policy if exists "events: event managers add" on public.events;
create policy "events: event managers add" on public.events for insert to authenticated with check (has_perm('manage_events'));
drop policy if exists "events: event managers delete" on public.events;
create policy "events: event managers delete" on public.events for delete to authenticated using (has_perm('manage_events'));

drop policy if exists "sermons: sermon managers write" on public.sermons;
create policy "sermons: sermon managers write" on public.sermons for all to authenticated using (has_perm('manage_sermons')) with check (has_perm('manage_sermons'));

drop policy if exists "board: moderators remove" on public.board;
create policy "board: moderators remove" on public.board for update to authenticated using (has_perm('moderate_board')) with check (has_perm('moderate_board'));
drop policy if exists "board: moderators delete" on public.board;
create policy "board: moderators delete" on public.board for delete to authenticated using (has_perm('moderate_board'));
drop policy if exists "replies: moderators delete" on public.board_replies;
create policy "replies: moderators delete" on public.board_replies for delete to authenticated using (has_perm('moderate_board'));
drop policy if exists "flags: moderators read" on public.flags;
create policy "flags: moderators read" on public.flags for select to authenticated using (has_perm('moderate_board'));
drop policy if exists "flags: moderators dismiss" on public.flags;
create policy "flags: moderators dismiss" on public.flags for delete to authenticated using (has_perm('moderate_board'));

-- Prayer meetings and the prayer report
drop policy if exists "meetings: prayer coordinators read" on public.prayer_meetings;
create policy "meetings: prayer coordinators read" on public.prayer_meetings for select to authenticated using (has_perm('prayer_meetings') or has_perm('view_prayer_report'));
drop policy if exists "meetings: prayer coordinators add" on public.prayer_meetings;
create policy "meetings: prayer coordinators add" on public.prayer_meetings for insert to authenticated with check (has_perm('prayer_meetings') and created_by = auth.uid());
drop policy if exists "meetings: prayer coordinators edit" on public.prayer_meetings;
create policy "meetings: prayer coordinators edit" on public.prayer_meetings for update to authenticated using (has_perm('prayer_meetings')) with check (has_perm('prayer_meetings'));
drop policy if exists "meetings: prayer coordinators delete" on public.prayer_meetings;
create policy "meetings: prayer coordinators delete" on public.prayer_meetings for delete to authenticated using (has_perm('prayer_meetings'));

create or replace function public.leads_person(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select has_perm('view_prayer_report') or (my_role() = 'leader' and my_group() is not null
    and exists (select 1 from profiles where id = p and group_id = my_group()))
$$;

create or replace function public.prayer_stats(p_weeks int default 4)
returns table (uid uuid, name text, group_id uuid, role text, week_start date,
               prayed_days int, meetings_attended int, meeting_seconds int, app_seconds int, app_opens int)
language sql stable security definer set search_path = public as $$
  with weeks as (
    select (date_trunc('week', (now() at time zone church_tz())::date) - make_interval(weeks => n))::date as week_start
    from generate_series(0, greatest(1, least(coalesce(p_weeks, 4), 12)) - 1) as n
  ), people as (
    select p.id, p.name, p.group_id, p.role, p.created_at from profiles p
    where has_perm('view_prayer_report') or (my_role() = 'leader' and my_group() is not null and p.group_id = my_group())
  )
  select pe.id, pe.name, pe.group_id, pe.role, w.week_start,
    (select count(*)::int from days d
      where d.uid = pe.id and 'pray' = any(d.done) and d.date >= w.week_start::text and d.date < (w.week_start + 7)::text),
    (select count(*)::int from prayer_checkins c where c.uid = pe.id and c.date >= w.week_start and c.date < w.week_start + 7),
    (select coalesce(sum(c.seconds), 0)::int from prayer_checkins c where c.uid = pe.id and c.date >= w.week_start and c.date < w.week_start + 7),
    (select coalesce(sum(u.seconds), 0)::int from app_usage u where u.uid = pe.id and u.date >= w.week_start and u.date < w.week_start + 7),
    (select coalesce(sum(u.opens), 0)::int from app_usage u where u.uid = pe.id and u.date >= w.week_start and u.date < w.week_start + 7)
  from people pe join weeks w on pe.created_at < (w.week_start + 7)
$$;

create or replace function public.meeting_report(m uuid, d date)
returns table (uid uuid, name text, group_id uuid, joined_at timestamptz, seconds int)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.group_id, c.joined_at, coalesce(c.seconds, 0)
  from prayer_meetings mt
  join profiles p on (mt.audience = 'all' or p.group_id::text = mt.audience)
  left join prayer_checkins c on c.meeting_id = mt.id and c.uid = p.id and c.date = d
  where mt.id = m and (has_perm('view_prayer_report') or has_perm('prayer_meetings')
    or (my_role() = 'leader' and my_group() is not null and p.group_id = my_group()))
$$;

do $$
declare f text;
begin
  foreach f in array array['has_perm(text)', 'in_position(uuid)', 'complete_duty(uuid, boolean)', 'set_role(uuid, text, uuid)',
                           'leads_person(uuid)', 'prayer_stats(int)', 'meeting_report(uuid, date)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.guard_profile() from public, anon, authenticated;

-- Live updates
do $$
begin
  begin alter publication supabase_realtime add table public.positions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.position_members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.duties; exception when duplicate_object then null; end;
end $$;
