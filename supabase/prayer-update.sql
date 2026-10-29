-- Prayer meetings, prayer report and app time.
-- Run this ONCE in Supabase → SQL Editor → New query (empty the box first), then click Run.
-- It adds to the existing database; it does not change or remove anything already there.

-- Church time zone, used to know when a prayer meeting is "on".
alter table public.settings add column if not exists tz text not null default 'Africa/Accra';

create or replace function public.church_tz() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select tz from settings where id = 1), 'Africa/Accra')
$$;

-- =========================================================
-- Tables
-- =========================================================
create table if not exists public.prayer_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  start_time time not null,
  duration_min int not null default 60 check (duration_min between 5 and 300),
  days int[] not null default '{0,1,2,3,4,5,6}', -- 0 = Sunday … 6 = Saturday
  audience text not null default 'all',           -- 'all' or a bacenta id
  points text not null default '',                -- prayer points shown in the prayer room
  active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One row per person per meeting per day. Time is counted by the server, not the phone.
create table if not exists public.prayer_checkins (
  meeting_id uuid not null references public.prayer_meetings(id) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  date date not null,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  seconds int not null default 0,
  primary key (meeting_id, uid, date)
);

-- Time spent with the app open, per person per day.
create table if not exists public.app_usage (
  uid uuid not null references auth.users(id) on delete cascade,
  date date not null,
  seconds int not null default 0,
  opens int not null default 0,
  last_seen timestamptz,
  primary key (uid, date)
);

create index if not exists prayer_checkins_uid_date on public.prayer_checkins (uid, date);

-- =========================================================
-- Who can see what
-- =========================================================
alter table public.prayer_meetings enable row level security;
alter table public.prayer_checkins enable row level security;
alter table public.app_usage enable row level security;

-- Is this person in the bacenta the current leader leads?
create or replace function public.leads_person(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_pastor() or (my_role() = 'leader' and my_group() is not null
    and exists (select 1 from profiles where id = p and group_id = my_group()))
$$;

drop policy if exists "meetings: audience reads" on public.prayer_meetings;
create policy "meetings: audience reads" on public.prayer_meetings for select to authenticated using (
  has_profile() and (is_pastor() or created_by = auth.uid() or audience = 'all' or audience = my_group()::text));
drop policy if exists "meetings: pastor or own-bacenta leader adds" on public.prayer_meetings;
create policy "meetings: pastor or own-bacenta leader adds" on public.prayer_meetings for insert to authenticated with check (
  created_by = auth.uid() and (is_pastor() or (my_role() = 'leader' and audience = my_group()::text)));
drop policy if exists "meetings: creator or pastor edits" on public.prayer_meetings;
create policy "meetings: creator or pastor edits" on public.prayer_meetings for update to authenticated
  using (is_pastor() or created_by = auth.uid()) with check (is_pastor() or created_by = auth.uid());
drop policy if exists "meetings: creator or pastor deletes" on public.prayer_meetings;
create policy "meetings: creator or pastor deletes" on public.prayer_meetings for delete to authenticated using (is_pastor() or created_by = auth.uid());

-- Check-ins and app time: yourself, your bacenta leader, and the pastor. Written only by the functions below.
drop policy if exists "checkins: self, leader, pastor read" on public.prayer_checkins;
create policy "checkins: self, leader, pastor read" on public.prayer_checkins for select to authenticated using (uid = auth.uid() or leads_person(uid));
drop policy if exists "usage: self, leader, pastor read" on public.app_usage;
create policy "usage: self, leader, pastor read" on public.app_usage for select to authenticated using (uid = auth.uid() or leads_person(uid));

-- =========================================================
-- Actions the app calls
-- =========================================================

-- Called every 30 seconds while the app is open. Counts time only between close heartbeats.
create or replace function public.track_usage() returns void
language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone church_tz())::date;
  gap numeric;
begin
  if auth.uid() is null or not has_profile() then return; end if;
  select extract(epoch from now() - last_seen) into gap from app_usage where uid = auth.uid() and date = d;
  if not found then
    insert into app_usage (uid, date, seconds, opens, last_seen) values (auth.uid(), d, 0, 1, now())
    on conflict (uid, date) do nothing;
  else
    update app_usage set
      seconds = seconds + case when gap <= 45 then round(gap)::int else 0 end,
      opens = opens + case when gap > 120 then 1 else 0 end,
      last_seen = now()
    where uid = auth.uid() and date = d;
  end if;
end $$;

-- Called when someone joins a prayer meeting, then every 30 seconds while the prayer room is open.
-- Only works while the meeting is actually on (from 5 minutes before the start to the end).
create or replace function public.prayer_heartbeat(m uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  mt prayer_meetings;
  loc timestamp := now() at time zone church_tz();
  d date := (now() at time zone church_tz())::date;
  st timestamp;
  secs int;
begin
  if not has_profile() then raise exception 'Sign in first'; end if;
  select * into mt from prayer_meetings where id = m and active;
  if not found then raise exception 'This prayer meeting is not active'; end if;
  if not (mt.audience = 'all' or mt.audience = coalesce(my_group()::text, '') or is_pastor() or mt.created_by = auth.uid()) then
    raise exception 'This prayer meeting is for another bacenta';
  end if;
  st := d + mt.start_time;
  if not (extract(dow from loc)::int = any(mt.days)) or loc < st - interval '5 minutes' or loc > st + make_interval(mins => mt.duration_min) then
    raise exception 'The prayer meeting is not on right now';
  end if;
  insert into prayer_checkins (meeting_id, uid, date, joined_at, last_seen, seconds)
  values (m, auth.uid(), d, now(), now(), 0)
  on conflict (meeting_id, uid, date) do update set
    seconds = prayer_checkins.seconds + case when extract(epoch from now() - prayer_checkins.last_seen) <= 45
                                             then round(extract(epoch from now() - prayer_checkins.last_seen))::int else 0 end,
    last_seen = now()
  returning seconds into secs;
  return secs;
end $$;

-- Weekly prayer report: one row per person per week (Monday to Sunday).
-- The pastor gets everyone; a leader gets their own bacenta. Journals are never included.
create or replace function public.prayer_stats(p_weeks int default 4)
returns table (uid uuid, name text, group_id uuid, role text, week_start date,
               prayed_days int, meetings_attended int, meeting_seconds int, app_seconds int, app_opens int)
language sql stable security definer set search_path = public as $$
  with weeks as (
    select (date_trunc('week', (now() at time zone church_tz())::date) - make_interval(weeks => n))::date as week_start
    from generate_series(0, greatest(1, least(coalesce(p_weeks, 4), 12)) - 1) as n
  ), people as (
    select p.id, p.name, p.group_id, p.role, p.created_at from profiles p
    where is_pastor() or (my_role() = 'leader' and my_group() is not null and p.group_id = my_group())
  )
  select pe.id, pe.name, pe.group_id, pe.role, w.week_start,
    (select count(*)::int from days d
      where d.uid = pe.id and 'pray' = any(d.done) and d.date >= w.week_start::text and d.date < (w.week_start + 7)::text),
    (select count(*)::int from prayer_checkins c where c.uid = pe.id and c.date >= w.week_start and c.date < w.week_start + 7),
    (select coalesce(sum(c.seconds), 0)::int from prayer_checkins c where c.uid = pe.id and c.date >= w.week_start and c.date < w.week_start + 7),
    (select coalesce(sum(u.seconds), 0)::int from app_usage u where u.uid = pe.id and u.date >= w.week_start and u.date < w.week_start + 7),
    (select coalesce(sum(u.opens), 0)::int from app_usage u where u.uid = pe.id and u.date >= w.week_start and u.date < w.week_start + 7)
  from people pe join weeks w on pe.created_at < (w.week_start + 7) -- only weeks since they joined the app
$$;

-- Who joined one meeting on one day, and who did not.
create or replace function public.meeting_report(m uuid, d date)
returns table (uid uuid, name text, group_id uuid, joined_at timestamptz, seconds int)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.group_id, c.joined_at, coalesce(c.seconds, 0)
  from prayer_meetings mt
  join profiles p on (mt.audience = 'all' or p.group_id::text = mt.audience)
  left join prayer_checkins c on c.meeting_id = mt.id and c.uid = p.id and c.date = d
  where mt.id = m and (is_pastor() or (my_role() = 'leader' and my_group() is not null and p.group_id = my_group()))
$$;

do $$
declare f text;
begin
  foreach f in array array['church_tz()', 'leads_person(uuid)', 'track_usage()', 'prayer_heartbeat(uuid)', 'prayer_stats(int)', 'meeting_report(uuid, date)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Live updates for meetings and check-ins.
do $$
begin
  begin alter publication supabase_realtime add table public.prayer_meetings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.prayer_checkins; exception when duplicate_object then null; end;
end $$;
