-- Shepherd Church App: database setup
-- Paste all of this into Supabase → SQL Editor → New query, then click Run. Run it once.
--
-- Roles:  pastor  – everything in the church
--         leader  – their own bacenta (members, attendance, reports, follow-ups)
--         member  – their own data, church-wide content, their bacenta's prayer requests
-- The FIRST account created becomes the pastor. Everyone after that joins as a member.
-- Ask & Share posts never store the author; ownership lives in board_owners, readable only by the author.

create extension if not exists pgcrypto;

-- =========================================================
-- Tables
-- =========================================================
create table public.settings (
  id int primary key default 1 check (id = 1),
  church_name text not null default 'Grace Harvest Chapel',
  momo text not null default '',
  momo_name text not null default '',
  campaign_name text not null default '',
  campaign_goal int not null default 0 check (campaign_goal >= 0),
  campaign_reached int not null default 0 check (campaign_reached >= 0)
);
insert into public.settings (id) values (1) on conflict do nothing;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  zone text not null default '',
  leader_id uuid,
  leader_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  email text,
  phone text not null default '',
  role text not null default 'member' check (role in ('member', 'leader', 'pastor')),
  group_id uuid references public.groups(id) on delete set null,
  progress jsonb not null default '{}',
  custom_tasks jsonb not null default '[]',
  hidden uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.groups add constraint groups_leader_fk foreign key (leader_id) references public.profiles(id) on delete set null;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null default '',
  group_id uuid not null references public.groups(id) on delete cascade,
  status text not null default 'New' check (status in ('Active', 'New', 'Inactive')),
  bday text not null default '',
  joined text not null default '',
  self_uid uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  type text not null default 'Call',
  note text not null check (char_length(note) between 1 and 1000),
  by uuid not null default auth.uid(),
  by_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.attendance (
  group_id uuid not null references public.groups(id) on delete cascade,
  week text not null,
  present uuid[] not null default '{}',
  by uuid default auth.uid(),
  at timestamptz not null default now(),
  primary key (group_id, week)
);

create table public.reports (
  group_id uuid not null references public.groups(id) on delete cascade,
  week text not null,
  att int not null default 0 check (att >= 0),
  off numeric not null default 0 check (off >= 0),
  bus int not null default 0 check (bus >= 0),
  souls int not null default 0 check (souls between 0 and 500),
  notes text not null default '',
  by uuid,
  by_name text not null default '',
  at timestamptz not null default now(),
  primary key (group_id, week)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 3000),
  audience text not null, -- 'all', 'leaders', or a bacenta id
  pinned boolean not null default false,
  by uuid not null default auth.uid(),
  by_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  date date not null,
  time text not null default '',
  place text not null default '',
  going uuid[] not null default '{}',
  by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  date date not null,
  scripture text not null default '',
  preacher text not null default '',
  points text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.prayers (
  id uuid primary key default gen_random_uuid(),
  by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  group_key text not null, -- a bacenta id, or 'church' for the pastor's requests
  body text not null check (char_length(body) between 1 and 2000),
  prayed uuid[] not null default '{}',
  answered boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.board (
  id uuid primary key default gen_random_uuid(),
  topic text not null check (char_length(topic) between 1 and 40),
  body text not null check (char_length(body) between 1 and 3000),
  support uuid[] not null default '{}',
  removed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.board_owners (
  post_id uuid primary key references public.board(id) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade
);

create table public.board_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  anon boolean not null default false,
  name text,
  private boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.flags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 300),
  created_at timestamptz not null default now()
);

create table public.days (
  uid uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date text not null,
  done text[] not null default '{}',
  journal text not null default '',
  primary key (uid, date)
);

create table public.giving (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null,
  amount numeric not null check (amount > 0),
  date date not null default current_date
);

create table public.sermon_notes (
  uid uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sermon_id uuid not null references public.sermons(id) on delete cascade,
  text text not null default '',
  primary key (uid, sermon_id)
);

create index on public.members (group_id);
create index on public.followups (member_id);
create index on public.prayers (group_key);
create index on public.board_replies (post_id);
create index on public.board_owners (uid);

-- =========================================================
-- Helper functions used by the security rules
-- =========================================================
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.my_group() returns uuid
language sql stable security definer set search_path = public as $$
  select group_id from profiles where id = auth.uid()
$$;

create or replace function public.has_profile() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid())
$$;

create or replace function public.is_pastor() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'pastor' from profiles where id = auth.uid()), false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('leader', 'pastor') from profiles where id = auth.uid()), false)
$$;

create or replace function public.leads_group(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'pastor' or (role = 'leader' and group_id = g) from profiles where id = auth.uid()), false)
$$;

create or replace function public.owns_post(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from board_owners where post_id = p and uid = auth.uid())
$$;

-- =========================================================
-- New accounts: create the profile automatically.
-- The very first account becomes the pastor.
-- =========================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  g uuid;
  n text;
  r text;
begin
  n := left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)), 80);
  begin
    g := nullif(new.raw_user_meta_data->>'group_id', '')::uuid;
  exception when others then
    g := null;
  end;
  if g is not null and not exists (select 1 from groups where id = g) then g := null; end if;
  r := case when exists (select 1 from profiles where role = 'pastor') then 'member' else 'pastor' end;
  insert into profiles (id, name, email, phone, role, group_id)
  values (new.id, n, new.email, coalesce(new.raw_user_meta_data->>'phone', ''), r, g);
  if g is not null then
    insert into members (name, phone, group_id, status, joined, self_uid)
    values (n, coalesce(new.raw_user_meta_data->>'phone', ''), g, 'New', to_char(now(), 'Mon YYYY'), new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only the pastor can change someone's role or bacenta.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.group_id is distinct from old.group_id
      or new.email is distinct from old.email or new.id <> old.id)
     and not public.is_pastor() then
    raise exception 'Only the pastor can change roles or bacentas';
  end if;
  return new;
end $$;

create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- =========================================================
-- Actions the app calls (each checks permissions itself)
-- =========================================================
create or replace function public.set_role(target uuid, new_role text, new_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_pastor() then raise exception 'Only the pastor can change roles'; end if;
  if new_role not in ('member', 'leader', 'pastor') then raise exception 'Unknown role'; end if;
  if target = auth.uid() then new_role := 'pastor'; end if; -- the pastor cannot demote themselves
  update profiles set role = new_role, group_id = new_group where id = target;
  update groups set leader_id = null, leader_name = ''
    where leader_id = target and (new_role <> 'leader' or id is distinct from new_group);
  if new_role = 'leader' and new_group is not null then
    update groups set leader_id = target, leader_name = (select name from profiles where id = target) where id = new_group;
  end if;
end $$;

create or replace function public.submit_report(g uuid, wk text, p_att int, p_off numeric, p_bus int, p_souls int, p_notes text) returns void
language plpgsql security definer set search_path = public as $$
declare
  old_souls int;
  s int := greatest(0, least(coalesce(p_souls, 0), 500));
begin
  if not leads_group(g) then raise exception 'You can only report for your own bacenta'; end if;
  select souls into old_souls from reports where group_id = g and week = wk;
  insert into reports (group_id, week, att, off, bus, souls, notes, by, by_name, at)
  values (g, wk, greatest(p_att, 0), greatest(p_off, 0), greatest(p_bus, 0), s, coalesce(p_notes, ''), auth.uid(),
          (select name from profiles where id = auth.uid()), now())
  on conflict (group_id, week) do update set att = excluded.att, off = excluded.off, bus = excluded.bus,
    souls = excluded.souls, notes = excluded.notes, by = excluded.by, by_name = excluded.by_name, at = now();
  update settings set campaign_reached = greatest(0, campaign_reached + s - coalesce(old_souls, 0)) where id = 1;
end $$;

create or replace function public.create_post(p_topic text, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  if not has_profile() then raise exception 'Sign in first'; end if;
  insert into board (topic, body) values (p_topic, p_body) returning id into pid;
  insert into board_owners (post_id, uid) values (pid, auth.uid());
  return pid;
end $$;

create or replace function public.toggle_support(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not has_profile() then raise exception 'Sign in first'; end if;
  update board set support = case when auth.uid() = any(support) then array_remove(support, auth.uid())
                                  else array_append(support, auth.uid()) end
  where id = p;
end $$;

create or replace function public.toggle_prayed(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update prayers set prayed = case when auth.uid() = any(prayed) then array_remove(prayed, auth.uid())
                                   else array_append(prayed, auth.uid()) end
  where id = p and has_profile()
    and (is_pastor() or group_key = 'church' or group_key = coalesce(my_group()::text, ''));
end $$;

create or replace function public.toggle_going(e uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not has_profile() then raise exception 'Sign in first'; end if;
  update events set going = case when auth.uid() = any(going) then array_remove(going, auth.uid())
                                 else array_append(going, auth.uid()) end
  where id = e;
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- Functions are callable only by signed-in users.
do $$
declare f text;
begin
  foreach f in array array['my_role()', 'my_group()', 'has_profile()', 'is_pastor()', 'is_staff()', 'leads_group(uuid)', 'owns_post(uuid)',
    'set_role(uuid, text, uuid)', 'submit_report(uuid, text, int, numeric, int, int, text)', 'create_post(text, text)',
    'toggle_support(uuid)', 'toggle_prayed(uuid)', 'toggle_going(uuid)', 'delete_my_account()']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_profile() from public, anon, authenticated;

-- =========================================================
-- Row Level Security (who can read and write what)
-- =========================================================
alter table public.settings enable row level security;
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.followups enable row level security;
alter table public.attendance enable row level security;
alter table public.reports enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.sermons enable row level security;
alter table public.prayers enable row level security;
alter table public.board enable row level security;
alter table public.board_owners enable row level security;
alter table public.board_replies enable row level security;
alter table public.flags enable row level security;
alter table public.days enable row level security;
alter table public.giving enable row level security;
alter table public.sermon_notes enable row level security;

-- Church name and bacenta list are public: the sign-up screen shows them.
create policy "settings: anyone reads" on public.settings for select using (true);
create policy "settings: pastor edits" on public.settings for update to authenticated using (is_pastor()) with check (is_pastor());

create policy "groups: anyone reads" on public.groups for select using (true);
create policy "groups: pastor adds" on public.groups for insert to authenticated with check (is_pastor());
create policy "groups: pastor edits" on public.groups for update to authenticated using (is_pastor()) with check (is_pastor());
create policy "groups: pastor deletes" on public.groups for delete to authenticated using (is_pastor());

create policy "profiles: self or pastor reads" on public.profiles for select to authenticated using (id = auth.uid() or is_pastor());
create policy "profiles: create own as member" on public.profiles for insert to authenticated with check (id = auth.uid() and role = 'member');
create policy "profiles: self or pastor edits" on public.profiles for update to authenticated using (id = auth.uid() or is_pastor()) with check (id = auth.uid() or is_pastor());

create policy "members: leaders of the bacenta" on public.members for all to authenticated
  using (leads_group(group_id)) with check (leads_group(group_id));

create policy "followups: leaders read" on public.followups for select to authenticated using (leads_group(group_id));
create policy "followups: leaders add" on public.followups for insert to authenticated with check (leads_group(group_id) and by = auth.uid());
create policy "followups: pastor deletes" on public.followups for delete to authenticated using (is_pastor());

create policy "attendance: leaders of the bacenta" on public.attendance for all to authenticated
  using (leads_group(group_id)) with check (leads_group(group_id));

create policy "reports: leaders read" on public.reports for select to authenticated using (leads_group(group_id));
create policy "reports: pastor deletes" on public.reports for delete to authenticated using (is_pastor());

create policy "announcements: audience reads" on public.announcements for select to authenticated using (
  is_pastor() or audience = 'all' or (audience = 'leaders' and is_staff()) or audience = my_group()::text);
create policy "announcements: pastor or own-bacenta leader posts" on public.announcements for insert to authenticated with check (
  by = auth.uid() and (is_pastor() or (my_role() = 'leader' and audience = my_group()::text)));
create policy "announcements: author or pastor deletes" on public.announcements for delete to authenticated using (is_pastor() or by = auth.uid());

create policy "events: members read" on public.events for select to authenticated using (has_profile());
create policy "events: leaders add" on public.events for insert to authenticated with check (is_staff());
create policy "events: leaders delete" on public.events for delete to authenticated using (is_staff());

create policy "sermons: members read" on public.sermons for select to authenticated using (has_profile());
create policy "sermons: pastor adds" on public.sermons for insert to authenticated with check (is_pastor());
create policy "sermons: pastor edits" on public.sermons for update to authenticated using (is_pastor()) with check (is_pastor());
create policy "sermons: pastor deletes" on public.sermons for delete to authenticated using (is_pastor());

create policy "prayers: bacenta and pastor read" on public.prayers for select to authenticated using (
  is_pastor() or group_key = 'church' or group_key = coalesce(my_group()::text, ''));
create policy "prayers: post own" on public.prayers for insert to authenticated with check (
  by = auth.uid() and prayed = '{}' and answered = false
  and (group_key = coalesce(my_group()::text, '') or (is_pastor() and group_key = 'church')));
create policy "prayers: author marks answered" on public.prayers for update to authenticated using (by = auth.uid()) with check (by = auth.uid());
create policy "prayers: author or pastor deletes" on public.prayers for delete to authenticated using (by = auth.uid() or is_pastor());

create policy "board: members read" on public.board for select to authenticated using (has_profile());
create policy "board: pastor removes" on public.board for update to authenticated using (is_pastor()) with check (is_pastor());
create policy "board: author or pastor deletes" on public.board for delete to authenticated using (is_pastor() or owns_post(id));

create policy "board_owners: author only" on public.board_owners for select to authenticated using (uid = auth.uid());

create policy "replies: public replies, private only to the author" on public.board_replies for select to authenticated using (
  has_profile() and (not private or owns_post(post_id)));
create policy "replies: members reply with their real name or none" on public.board_replies for insert to authenticated with check (
  has_profile() and ((anon and name is null) or (not anon and name = (select p.name from public.profiles p where p.id = auth.uid()))));
create policy "replies: pastor deletes" on public.board_replies for delete to authenticated using (is_pastor());

create policy "flags: members report" on public.flags for insert to authenticated with check (has_profile());
create policy "flags: pastor reads" on public.flags for select to authenticated using (is_pastor());
create policy "flags: pastor dismisses" on public.flags for delete to authenticated using (is_pastor());

create policy "days: own only" on public.days for all to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
create policy "giving: own only" on public.giving for all to authenticated using (uid = auth.uid()) with check (uid = auth.uid());
create policy "sermon_notes: own only" on public.sermon_notes for all to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

-- =========================================================
-- Live updates: phones refresh when something changes
-- =========================================================
alter publication supabase_realtime add table
  public.settings, public.groups, public.profiles, public.members, public.followups, public.attendance, public.reports,
  public.announcements, public.events, public.sermons, public.prayers, public.board, public.board_owners,
  public.board_replies, public.flags, public.days, public.giving, public.sermon_notes;
