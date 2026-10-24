import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.88.0/+esm';
import { SUPABASE_URL, SUPABASE_KEY, CHURCH } from './config.js';

const root = document.getElementById('root');
const configured = !String(SUPABASE_URL).startsWith('PASTE') && !String(SUPABASE_KEY).startsWith('PASTE');

/* ---------- icons ---------- */
const P = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.1.7 3.5 2.6 3.5 5.7"/>',
  chart:'<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>',
  bell:'<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  book:'<path d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6v13.5"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
  chev:'<path d="m9 5 7 7-7 7"/>',
  back:'<path d="m15 5-7 7 7 7"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  out:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  clip:'<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 12l2.5 2.5 4.5-5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  msg:'<path d="M4 5h16v11H9l-5 4z"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  church:'<path d="M12 2v5M10 4h4"/><path d="M5 21V12l7-5 7 5v9"/><path d="M10 21v-4a2 2 0 0 1 4 0v4M3 21h18"/>',
  talk:'<path d="M3.5 4.5h12v9h-7l-5 3.5z"/><path d="M18.5 9h2v10l-3.5-2.5H11v-3"/>',
  bible:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 7v7M9.5 9.5h5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  download:'<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  share:'<path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/>'
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const initials = n => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const money = n => CHURCH.currency + Number(n || 0).toLocaleString('en-GH');

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function dayKey(off = 0) { const d = new Date(); d.setDate(d.getDate() + off); return ymd(d); }
const todayKey = () => dayKey(0);
function dayOfYear() { const d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); }
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(); const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${pad(w)}`;
}
const THIS_WEEK = isoWeek();
const WEEKS = [3, 2, 1, 0].map(i => isoWeek(new Date(Date.now() - i * 7 * 864e5)));
const weekShort = w => w.split('-')[1];
function sundayLabel() { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay()) % 7); return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }); }
const todayLabel = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const fmt = ts => ts ? new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Just now';
const ms = ts => ts ? Date.parse(ts) : Date.now();
const newest = (a, b) => ms(b.createdAt) - ms(a.createdAt);
function dateParts(s) { const d = new Date(s + 'T12:00:00'); return { day: pad(d.getDate()), mon: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(), d }; }
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

/* ---------- static content ---------- */
const VERSES = [
  ['Psalm 118:24', 'This is the day which the LORD hath made; we will rejoice and be glad in it.'],
  ['Proverbs 3:5–6', 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.'],
  ['Isaiah 40:31', 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.'],
  ['Philippians 4:13', 'I can do all things through Christ which strengtheneth me.'],
  ['Joshua 1:9', 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.'],
  ['Matthew 28:19', 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.'],
  ['Psalm 23:1', 'The LORD is my shepherd; I shall not want.'],
  ['John 3:16', 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'],
  ['Romans 8:28', 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.'],
  ['Lamentations 3:22–23', 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.'],
  ['1 Peter 5:2', 'Feed the flock of God which is among you, taking the oversight thereof, not by constraint, but willingly.'],
  ['Psalm 46:1', 'God is our refuge and strength, a very present help in trouble.'],
  ['Matthew 6:33', 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.'],
  ['Philippians 4:6', 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.']
];
const verseOfDay = () => VERSES[dayOfYear() % VERSES.length];
const planDay = () => dayOfYear() % 21 + 1;
const TOPICS = ['Need advice', 'Going through something', 'Need encouragement', 'Testimony'];
const COMPETENCIES = {
  member: [['nbc', 'New Believers Class', 4], ['baptism', 'Water Baptism', 1], ['soul', 'Soul Winning', 4], ['ministry', 'Joining a Ministry', 2]],
  leader: [['soul', 'Soul Winning', 4], ['shepherd', 'Shepherding Members', 4], ['meeting', 'Leading a Bacenta Meeting', 4], ['reporting', 'Weekly Reporting', 4]]
};
const GUIDE = [
  ['How to record church attendance', 'Open Attendance from the Mission tab after the Sunday service. Tick each member who attended and save. Attendance must be saved before the weekly report.'],
  ['Weekly report deadline', 'Reports for each week are due Sunday at 9:00pm. The pastor sees which bacentas are still pending.'],
  ['Handling offering money', 'Count offering with a second leader present. Record the total in your report and hand cash to the church treasurer the same day.'],
  ['Following up new members', 'Call every new member within 48 hours of their first visit, and visit them within the first two weeks. Log each call or visit on their profile.'],
  ['Sunday busing', 'Book the bus by Friday. Record how many people rode the bus in the Sunday busing field of your report.'],
  ['Soul winning guide', 'Share the gospel in pairs. Record each person who gives their life to Christ and pass their details to the follow-up team.'],
  ['Ask & Share guidelines', 'Posts are anonymous. Be kind, do not name other people, and report anything harmful. The pastor can remove posts that break these guidelines.']
];
const ROLE_LABEL = { pastor: 'Pastor', leader: 'Bacenta Leader', member: 'Member' };

/* ---------- supabase ---------- */
const sb = configured ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

/* ---------- state ---------- */
const S = {
  user: null, profile: null, profileLoaded: false, settings: {}, groups: [], members: [], attendance: [], reports: [],
  announcements: [], events: [], prayers: [], sermons: [], followups: [], board: [], replies: [], myPosts: [], priv: {},
  days: [], giving: [], notes: [], users: [], flags: []
};
let tab = 'home', sheet = null, authMode = 'signin', peopleFilter = 'All', peopleQuery = '', guideQuery = '', boardFilter = 'All';
let attGroup = null, attDraft = null, confirmKey = null, installEvt = null, creatingProfile = false, recovery = false, authNotice = '';

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (S.profile) render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('Installed. Open Shepherd from your home screen.'); if (S.profile) render(); });
try { const t = localStorage.getItem('shepherd-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}

const me = () => S.profile;
const uid = () => S.user?.id;
const churchName = () => S.settings.churchName || CHURCH.name;
const groupOf = id => S.groups.find(g => g.id === id);
const groupName = id => id === 'church' ? 'Whole church' : groupOf(id)?.name || 'No bacenta yet';
const myGroups = () => me().role === 'pastor' ? S.groups.map(g => g.id) : (me().group ? [me().group] : []);
const reportFor = (g, w = THIS_WEEK) => S.reports.find(r => r.group === g && r.week === w);
const attendanceFor = (g, w = THIS_WEEK) => S.attendance.find(a => a.group === g && a.week === w);

/* ---------- loading data (Row Level Security decides what each person gets back) ---------- */
async function rows(table, build = q => q) {
  const { data, error } = await build(sb.from(table).select('*'));
  if (error) { console.warn('load', table, error.message); return []; }
  return data || [];
}
const mapProfile = r => r && { id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role, group: r.group_id || '', progress: r.progress || {}, customTasks: r.custom_tasks || [], hidden: r.hidden || [] };
const isStaffRole = () => me() && me().role !== 'member';
const LOADERS = {
  settings: async () => {
    const { data } = await sb.from('settings').select('*').eq('id', 1).maybeSingle();
    S.settings = data ? { churchName: data.church_name, momo: data.momo, momoName: data.momo_name, campaignName: data.campaign_name, campaignGoal: data.campaign_goal, campaignReached: data.campaign_reached } : {};
  },
  groups: async () => { S.groups = (await rows('groups')).map(g => ({ id: g.id, name: g.name, zone: g.zone, leaderUid: g.leader_id, leaderName: g.leader_name })).sort((a, b) => a.name.localeCompare(b.name)); },
  profile: async () => {
    const { data } = await sb.from('profiles').select('*').eq('id', uid()).maybeSingle();
    const prev = S.profile; S.profile = mapProfile(data);
    if (prev && S.profile && (prev.role !== S.profile.role || prev.group !== S.profile.group)) await loadAll();
  },
  users: async () => { S.users = me()?.role === 'pastor' ? (await rows('profiles')).map(mapProfile) : []; },
  members: async () => { S.members = isStaffRole() ? (await rows('members')).map(m => ({ ...m, group: m.group_id })) : []; },
  followups: async () => { S.followups = isStaffRole() ? (await rows('followups')).map(f => ({ id: f.id, member: f.member_id, group: f.group_id, type: f.type, note: f.note, byName: f.by_name, createdAt: f.created_at })) : []; },
  attendance: async () => { S.attendance = isStaffRole() ? (await rows('attendance')).map(a => ({ group: a.group_id, week: a.week, present: a.present || [] })) : []; },
  reports: async () => { S.reports = isStaffRole() ? (await rows('reports')).map(r => ({ group: r.group_id, week: r.week, att: r.att, off: Number(r.off), bus: r.bus, souls: r.souls, notes: r.notes, by: r.by, byName: r.by_name, at: r.at })) : []; },
  announcements: async () => { S.announcements = (await rows('announcements')).map(a => ({ id: a.id, title: a.title, body: a.body, audience: a.audience, pinned: a.pinned, by: a.by, byName: a.by_name, createdAt: a.created_at })); },
  events: async () => { S.events = (await rows('events')).map(e => ({ ...e, date: String(e.date).slice(0, 10), going: e.going || [] })); },
  sermons: async () => { S.sermons = (await rows('sermons')).map(s => ({ ...s, date: String(s.date).slice(0, 10), points: s.points || [] })); },
  prayers: async () => { S.prayers = (await rows('prayers')).map(p => ({ id: p.id, by: p.by, name: p.name, group: p.group_key, body: p.body, prayed: p.prayed || [], answered: p.answered, createdAt: p.created_at })); },
  board: async () => {
    const [posts, owners, replies] = await Promise.all([rows('board'), rows('board_owners'), rows('board_replies')]);
    S.board = posts.map(b => ({ id: b.id, topic: b.topic, body: b.body, support: b.support || [], removed: b.removed, createdAt: b.created_at }));
    S.myPosts = owners.map(o => ({ id: o.post_id }));
    const shape = r => ({ id: r.id, postId: r.post_id, body: r.body, anon: r.anon, name: r.name, createdAt: r.created_at });
    S.replies = replies.filter(r => !r.private).map(shape);
    S.priv = {}; replies.filter(r => r.private).forEach(r => (S.priv[r.post_id] ||= []).push(shape(r)));
  },
  flags: async () => { S.flags = me()?.role === 'pastor' ? (await rows('flags')).map(f => ({ id: f.id, postId: f.post_id, reason: f.reason })) : []; },
  days: async () => { S.days = (await rows('days', q => q.gte('date', dayKey(-60)))).map(d => ({ id: d.date, done: d.done || [], journal: d.journal || '' })); },
  giving: async () => { S.giving = (await rows('giving')).map(g => ({ ...g, amount: Number(g.amount), date: String(g.date).slice(0, 10) })); },
  notes: async () => { S.notes = (await rows('sermon_notes')).map(n => ({ id: n.sermon_id, text: n.text })); }
};
const SIGNED_IN_KEYS = ['settings', 'groups', 'users', 'members', 'followups', 'attendance', 'reports', 'announcements', 'events', 'sermons', 'prayers', 'board', 'flags', 'days', 'giving', 'notes'];
async function loadAll() { await Promise.all(SIGNED_IN_KEYS.map(k => LOADERS[k]().catch(e => console.warn(k, e)))); }
async function reload(...keys) { await Promise.all(keys.map(k => LOADERS[k]().catch(e => console.warn(k, e)))); render(); }

/* ---------- live updates ---------- */
const TABLE_KEYS = {
  settings: ['settings'], groups: ['groups'], profiles: ['profile', 'users'], members: ['members'], followups: ['followups'],
  attendance: ['attendance'], reports: ['reports'], announcements: ['announcements'], events: ['events'], sermons: ['sermons'],
  prayers: ['prayers'], board: ['board'], board_owners: ['board'], board_replies: ['board'], flags: ['flags'], days: ['days'],
  giving: ['giving'], sermon_notes: ['notes']
};
let channel = null, liveTimer = null; const pendingKeys = new Set();
function scheduleReload(keys) {
  keys.forEach(k => pendingKeys.add(k)); clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { const ks = [...pendingKeys]; pendingKeys.clear(); if (S.user) reload(...ks); }, 200);
}
function startRealtime() {
  stopRealtime();
  channel = sb.channel('church-' + uid()).on('postgres_changes', { event: '*', schema: 'public' }, p => scheduleReload(TABLE_KEYS[p.table] || [])).subscribe();
}
function stopRealtime() { if (channel) { sb.removeChannel(channel); channel = null; } }
// Catch anything missed while the phone was asleep.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.profile) reload('profile', ...SIGNED_IN_KEYS); });

/* ---------- sign-in state ---------- */
let sessionUid = null;
async function onSession(session) {
  const user = session?.user || null;
  if ((user?.id || null) === sessionUid) { S.user = user; return; }
  sessionUid = user?.id || null; stopRealtime();
  Object.assign(S, { user, profile: null, profileLoaded: false, members: [], attendance: [], reports: [], announcements: [], events: [], prayers: [], sermons: [], followups: [], board: [], replies: [], myPosts: [], priv: {}, days: [], giving: [], notes: [], users: [], flags: [] });
  if (!user) { tab = 'home'; sheet = null; render(); return; }
  authNotice = ''; render();
  await LOADERS.profile();
  S.profileLoaded = true;
  if (S.profile) {
    await loadAll(); startRealtime();
    if (localSeen() !== todayKey()) sheet = { type: 'verse' };
  }
  render();
}
if (configured) {
  reload('settings', 'groups');
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') recovery = true;
    // Run outside the auth callback so other Supabase calls don't wait on it.
    setTimeout(() => onSession(session), 0);
  });
}
function localSeen() { try { return localStorage.getItem('shepherd-verse-' + uid()); } catch (e) { return null; } }
function markVerseSeen() { try { localStorage.setItem('shepherd-verse-' + uid(), todayKey()); } catch (e) {} }

/* ---------- feedback ---------- */
let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2600);
}
const ERRORS = [
  [/invalid login credentials/i, 'That email and password don’t match.'],
  [/email not confirmed/i, 'Confirm your email first. Open the link we sent you, then sign in.'],
  [/already registered|already been registered/i, 'An account already uses that email. Sign in instead.'],
  [/password should be|weak password|at least 6/i, 'Use a password with at least 6 characters.'],
  [/unable to validate email|invalid email|email address .* is invalid/i, 'Enter a valid email address.'],
  [/rate limit|too many/i, 'Too many attempts. Wait a few minutes and try again.'],
  [/failed to fetch|network/i, 'No internet connection. Check your data and try again.'],
  [/row-level security|permission denied|only the pastor|own bacenta/i, 'You don’t have permission to do that.']
];
const errMsg = e => (ERRORS.find(([re]) => re.test(e?.message || '')) || [, 'Something went wrong. Check your connection and try again.'])[1];
let lastOk = false;
// Supabase returns { error } instead of throwing; treat both the same and refresh the affected data.
async function run(promise, ok, ...keys) {
  try {
    const res = await promise; if (res?.error) throw res.error;
    lastOk = true; if (keys.length) await reload(...keys); if (ok) toast(ok); return true;
  } catch (e) { console.warn(e); toast(errMsg(e)); return false; }
}
function showErr(id, msg) { const e = document.getElementById(id); if (e) { e.textContent = msg; e.hidden = false; } }
const clearDrafts = () => root.querySelectorAll('[data-dirty]').forEach(el => delete el.dataset.dirty);
function go(t) { clearDrafts(); tab = t; sheet = null; confirmKey = null; render(); window.scrollTo(0, 0); }
function openSheet(s) { root.querySelectorAll('.sheet [data-dirty]').forEach(el => delete el.dataset.dirty); sheet = s; confirmKey = null; render(); }

const TABS = {
  pastor: [['home', 'Home', 'home'], ['mission', 'Mission', 'flag'], ['people', 'People', 'users'], ['health', 'Health', 'chart'], ['more', 'More', 'more']],
  leader: [['home', 'Home', 'home'], ['mission', 'Mission', 'flag'], ['people', 'People', 'users'], ['report', 'Report', 'file'], ['more', 'More', 'more']],
  member: [['home', 'Home', 'home'], ['devotion', 'Devotion', 'bible'], ['board', 'Share', 'talk'], ['prayer', 'Prayer', 'msg'], ['more', 'More', 'more']]
};

/* ---------- shared pieces ---------- */
function header(title, back) {
  return `<div class="top">${back ? `<button class="icon-btn" data-go="${back}" aria-label="Back">${ic('back')}</button>` : ''}
    <div class="grow stack"><span class="eyebrow gold">${esc(churchName())}</span><h1>${esc(title)}</h1></div></div>`;
}
const empty = (msg, btn = '') => `<div class="empty">${msg}${btn}</div>`;
const statusPill = s => `<span class="pill ${s === 'Active' ? 'ok' : s === 'New' ? 'new' : 'off'}">${esc(s)}</span>`;
const delBtn = (key, label = 'Delete') => `<button class="btn sm danger" data-del="${key}">${confirmKey === key ? 'Tap again to confirm' : label}</button>`;

function weekStats(groupIds) {
  return WEEKS.map(w => S.reports.filter(r => r.week === w && groupIds.includes(r.group))
    .reduce((a, r) => ({ att: a.att + (r.att || 0), off: a.off + (r.off || 0), bus: a.bus + (r.bus || 0), souls: a.souls + (r.souls || 0) }), { att: 0, off: 0, bus: 0, souls: 0 }));
}
function bars(vals, color) {
  const max = Math.max(...vals, 1);
  return `<div class="chart">${vals.map(v => `<div class="bar-col"><span class="bar-val">${v ? v.toLocaleString() : '–'}</span><div class="bar" style="height:${Math.round(v / max * 85)}%;background:var(${color})"></div></div>`).join('')}</div>
    <div class="chart-x">${WEEKS.map(w => `<span>${weekShort(w)}</span>`).join('')}</div>`;
}
function last4Card(groupIds, title) {
  const s = weekStats(groupIds); const sum = k => s.reduce((a, x) => a + x[k], 0);
  return `<section class="card"><span class="eyebrow">${esc(title)} · last 4 weeks</span>
    <div class="stats">
      <div class="stat"><b style="color:var(--blue)">${sum('att')}</b><span>Attendance</span></div>
      <div class="stat"><b style="color:var(--green)">${sum('off').toLocaleString()}</b><span>Offering (${CHURCH.currency})</span></div>
      <div class="stat"><b style="color:var(--amber)">${sum('bus')}</b><span>Sunday busing</span></div>
    </div>
    <div class="stack"><span class="small muted">Bacenta fellowship attendance</span>${bars(s.map(x => x.att), '--blue')}</div>
    <div class="stack"><span class="small muted">Offering / income (${CHURCH.currency})</span>${bars(s.map(x => x.off), '--green')}</div>
    <div class="stack"><span class="small muted">Sunday busing attendance</span>${bars(s.map(x => x.bus), '--amber')}</div></section>`;
}
function annItem(a) {
  const aud = a.audience === 'all' ? 'Everyone' : a.audience === 'leaders' ? 'Leaders' : groupName(a.audience);
  const canDel = me().role === 'pastor' || a.by === uid();
  return `<div class="li" style="align-items:flex-start"><div class="tile-ico cream" style="width:38px;height:38px">${ic('bell')}</div>
    <div class="stack grow"><div class="row between"><strong>${esc(a.title)}</strong>${a.pinned ? '<span class="pill due">Pinned</span>' : ''}</div>
    <p class="small" style="white-space:pre-line">${esc(a.body)}</p><span class="small muted">${esc(a.byName)} · ${fmt(a.createdAt)} · ${esc(aud)}</span>
    ${canDel && tab === 'announcements' ? `<div>${delBtn('ann:' + a.id)}</div>` : ''}</div></div>`;
}
const sortedAnns = () => S.announcements.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || newest(a, b));

/* ---------- devotion ---------- */
const dayDoc = (key = todayKey()) => S.days.find(d => d.id === key) || { done: [], journal: '' };
function tasksFor(p) {
  const n = S.members.filter(m => myGroups().includes(m.group)).length;
  const base = [
    { id: 'read', title: `Read John ${planDay()}`, detail: 'Reading plan · Gospel of John in 21 days' },
    { id: 'pray', title: 'Pray for 15 minutes', detail: 'Thanksgiving, worship and your requests' },
    { id: 'verse', title: 'Memorise the verse of the day', detail: verseOfDay()[0] }
  ];
  const extra = p.role === 'member'
    ? [{ id: 'share', title: 'Share God’s word with one person', detail: 'A text, a call or a conversation' }]
    : [{ id: 'members', title: 'Pray for your members by name', detail: n ? `${n} members in your care` : 'Everyone in your care' },
       { id: 'call', title: 'Call or text one member', detail: 'Check on someone you have not seen this week' }];
  return [...base, ...extra, ...(p.customTasks || []).map(c => ({ ...c, detail: 'Your daily task', custom: true }))];
}
const coreIds = p => tasksFor(p).filter(t => !t.custom).map(t => t.id);
function dayComplete(p, key) { const x = S.days.find(d => d.id === key); return !!x && coreIds(p).every(id => (x.done || []).includes(id)); }
function streakOf(p) { let n = 0; for (let i = 0; i < 60; i++) { if (dayComplete(p, dayKey(-i))) n++; else if (i > 0) break; } return n; }
function verseCard(big) {
  const [ref, text] = verseOfDay();
  return `<section class="card verse"><div class="row between"><span class="eyebrow gold">Verse of the day</span><span class="small muted">${esc(todayLabel())}</span></div>
    <blockquote style="${big ? 'font-size:22px' : ''}">“${esc(text)}”</blockquote><cite>${esc(ref)} · KJV</cite></section>`;
}
function taskList(p) {
  const d = dayDoc();
  return `<div class="list">${tasksFor(p).map(t => { const on = (d.done || []).includes(t.id); return `<div class="row"><button class="li task grow ${on ? 'done' : ''}" data-task="${esc(t.id)}" aria-pressed="${on}"><span class="check ${on ? 'on' : ''}">${ic('check')}</span><span class="stack grow"><span class="task-t">${esc(t.title)}</span><span class="small muted">${esc(t.detail)}</span></span></button>${t.custom ? `<button class="icon-btn" data-deltask="${esc(t.id)}" aria-label="Remove task" style="width:32px;height:32px">${ic('x')}</button>` : ''}</div>`; }).join('')}</div>`;
}

/* ---------- screens: auth ---------- */
const credit = '<p class="small muted" style="text-align:center">Designed by Axe Connect</p>';

function setupScreen() {
  return `<main class="login"><div class="brand"><div class="brand-mark">${ic('church')}</div><strong style="font-size:18px">Shepherd</strong></div>
    <section class="card"><h2>Connect Supabase to finish setup</h2><p class="muted">Open <code>config.js</code> and paste your Supabase project URL and publishable key. The README explains each step.</p></section></main>`;
}
function loginScreen() {
  const up = authMode === 'signup';
  return `<main class="login">
    <div class="brand"><div class="brand-mark">${ic('church')}</div><div class="stack"><span class="eyebrow gold">${esc(churchName())}</span><strong style="font-size:18px">Shepherd</strong></div></div>
    <div class="stack" style="gap:8px"><h1>${up ? 'Create your account' : 'Sign in to your ministry'}</h1><p class="muted">Your home screen, reports and tools are set up for your role in the church.</p></div>
    <div class="seg" role="group" aria-label="Sign in or create account"><button data-auth="signin" aria-pressed="${!up}">Sign in</button><button data-auth="signup" aria-pressed="${up}">Create account</button></div>
    ${authNotice ? `<div class="alert" role="status"><strong>Check your email</strong><span class="small">${esc(authNotice)}</span></div>` : ''}
    <form id="${up ? 'signup-form' : 'login-form'}" class="card" novalidate>
      ${up ? `<div class="field"><label for="su-name">Full name</label><input class="input" id="su-name" autocomplete="name" required></div>
        <div class="field"><label for="su-phone">Phone</label><input class="input" id="su-phone" inputmode="tel" autocomplete="tel" placeholder="024 000 0000"></div>
        <div class="field"><label for="su-group">Your bacenta</label><select class="input" id="su-group"><option value="">I don’t know yet</option>${S.groups.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}</select></div>` : ''}
      <div class="field"><label for="au-email">Email</label><input class="input" id="au-email" type="email" autocomplete="username" placeholder="you@example.com"></div>
      <div class="field"><label for="au-pass">Password</label><input class="input" id="au-pass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'At least 6 characters' : 'Password'}"></div>
      <p class="err" id="au-err" hidden></p>
      <button class="btn block" type="submit">${up ? 'Create account' : 'Sign in'}</button>
      ${up ? '' : '<button type="button" class="link" data-act="forgot">Forgot your password?</button>'}
    </form>
    ${up ? '<p class="small muted">New accounts join as members. Your pastor can make you a leader.</p>' : ''}
    ${credit}
  </main>`;
}
function newPasswordScreen() {
  return `<main class="login"><div class="stack" style="gap:8px"><h1>Choose a new password</h1><p class="muted">For ${esc(S.user.email)}.</p></div>
    <form id="newpass-form" class="card" novalidate><div class="field"><label for="np-pass">New password</label><input class="input" id="np-pass" type="password" autocomplete="new-password" placeholder="At least 6 characters"></div>
    <p class="err" id="np-err" hidden></p><button class="btn block">Save password</button></form></main>`;
}
function profileSetupScreen() {
  return `<main class="login"><div class="stack" style="gap:8px"><h1>Finish your profile</h1><p class="muted">Signed in as ${esc(S.user.email)}.</p></div>
    <form id="profile-setup" class="card" novalidate>
      <div class="field"><label for="ps-name">Full name</label><input class="input" id="ps-name" required></div>
      <div class="field"><label for="ps-phone">Phone</label><input class="input" id="ps-phone" inputmode="tel"></div>
      <div class="field"><label for="ps-group">Your bacenta</label><select class="input" id="ps-group"><option value="">I don’t know yet</option>${S.groups.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}</select></div>
      <p class="err" id="ps-err" hidden></p><button class="btn block">Continue</button>
      <button type="button" class="link" data-act="logout">Sign out</button></form></main>`;
}

/* ---------- screens: home & mission ---------- */
/* ---------- install prompt ---------- */
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isPhone = isIOS || /android/i.test(navigator.userAgent);
function installLater() { try { return localStorage.getItem('shepherd-install-later') === todayKey(); } catch (e) { return false; } }
function installCard() {
  if (isStandalone() || installLater() || (!installEvt && !isPhone)) return '';
  const later = '<button class="btn sm ghost" data-act="installLater">Not now</button>';
  if (installEvt) {
    return `<section class="card"><div class="row"><div class="tile-ico cream">${ic('download')}</div><div class="stack grow"><strong>Install Shepherd on this phone</strong><span class="small muted">Open it from your home screen like any other app.</span></div></div>
      <div class="row" style="gap:8px"><button class="btn" data-act="install">${ic('download')} Install app</button>${later}</div></section>`;
  }
  const steps = isIOS
    ? `<li><span class="dot"></span><span>Tap the <strong>Share</strong> button ${ic('share')} at the bottom of Safari.</span></li><li><span class="dot"></span><span>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</span></li>`
    : `<li><span class="dot"></span><span>Tap the browser menu <strong>⋮</strong> at the top right.</span></li><li><span class="dot"></span><span>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span></li>`;
  return `<section class="card"><div class="row"><div class="tile-ico cream">${ic('download')}</div><div class="stack grow"><strong>Add Shepherd to your home screen</strong><span class="small muted">So it opens like an app, full screen.</span></div></div>
    <ul class="todo">${steps}</ul><div>${later}</div></section>`;
}

function hubScreen() {
  const p = me(); const first = p.name.split(' ')[0];
  const t = tasksFor(p), d = dayDoc(), done = t.filter(x => (d.done || []).includes(x.id)).length;
  const pendingAtt = p.role === 'member' ? [] : myGroups().filter(g => !attendanceFor(g));
  return `<div class="stack" style="gap:4px"><h1>${greeting()}, ${esc(first)}</h1><p class="muted small">${p.role === 'member' ? 'How is your walk with God today?' : 'What ministry would you like to focus on today?'}</p></div>
    ${installCard()}
    ${verseCard()}
    <section class="card"><div class="row between"><h2>Today with God</h2><span class="pill ${done === t.length ? 'ok' : ''}">${done}/${t.length} done</span></div>
      <div class="progress"><i style="width:${Math.round(done / t.length * 100)}%;background:var(--green)"></i></div>
      ${taskList(p)}
      <div class="row between"><span class="small"><strong class="num">${streakOf(p)}</strong> <span class="muted">day streak</span></span><button class="btn sm ghost" data-go="devotion">Open devotion</button></div></section>
    ${pendingAtt.length ? `<div class="alert" role="alert"><div class="row">${ic('alert')}<div class="stack"><strong>Church attendance not recorded</strong><span class="small">${p.role === 'pastor' ? `${pendingAtt.length} bacenta(s) still pending this week.` : 'Record Sunday attendance for your bacenta.'}</span></div></div><div><button class="btn sm" data-go="attendance">Open attendance</button></div></div>` : ''}
    ${boardNotice()}
    ${p.role === 'member' ? memberSnippet() : ''}
    ${navGrid()}`;
}
function memberSnippet() {
  const p = me(); const next = upcomingEvents()[0];
  const month = S.giving.filter(g => (g.date || '').slice(0, 7) === todayKey().slice(0, 7)).reduce((a, g) => a + (g.amount || 0), 0);
  const prog = COMPETENCIES.member; const doneSteps = prog.filter(([k, , of]) => (p.progress?.[k] || 0) >= of).length;
  const anns = sortedAnns().slice(0, 2);
  return `${next ? `<section class="card"><div class="row"><div class="date-block"><span>${dateParts(next.date).mon}</span><b>${dateParts(next.date).day}</b></div><div class="stack grow"><span class="eyebrow">Coming up</span><strong>${esc(next.title)}</strong><span class="small muted">${esc(next.time)} · ${esc(next.place)}</span></div></div>
      <button class="btn ${(next.going || []).includes(uid()) ? 'ghost' : ''}" data-rsvp="${next.id}">${(next.going || []).includes(uid()) ? `${ic('check')} You’re attending` : 'I’ll be there'}</button></section>` : ''}
    <div class="stats">
      <div class="stat"><b style="color:var(--blue)">${streakOf(p)}</b><span>Devotion streak</span></div>
      <div class="stat"><b style="color:var(--green)">${month.toLocaleString()}</b><span>Given this month</span></div>
      <div class="stat"><b style="color:var(--amber)">${doneSteps}/${prog.length}</b><span>Growth steps</span></div>
    </div>
    ${anns.length ? `<section class="card"><div class="row between"><h2>Announcements</h2><button class="btn sm ghost" data-go="announcements">See all</button></div><div class="list">${anns.map(annItem).join('')}</div></section>` : ''}
    <section class="card"><div class="row"><div class="tile-ico cream">${ic('msg')}</div><div class="stack grow"><strong>Need prayer?</strong><span class="small muted">Your request goes to your bacenta and the pastor.</span></div></div>
      <button class="btn ghost" data-sheet="prayer">Send a prayer request</button></section>`;
}
function navGrid() {
  const p = me();
  const items = p.role === 'member'
    ? [['devotion', 'Daily Devotion', 'Verse, Bible reading and prayer.', 'bible', 'cream'], ['progress', 'My Progress', 'Your growth steps and classes.', 'chart', ''], ['announcements', 'Announcements', 'News from the church.', 'bell', 'cream'], ['board', 'Ask & Share', 'Post anonymously for advice or support.', 'talk', 'cream'], ['prayer', 'Prayer Wall', 'Pray for one another.', 'msg', ''], ['sermons', 'Sermon Notes', 'Sunday messages and your notes.', 'book', 'cream'], ['events', 'Events', 'Services and programmes.', 'cal', ''], ['giving', 'Giving', 'Your tithes and offerings.', 'heart', 'green'], ['guide', 'Field Guide', 'Find policies and resources.', 'book', '']]
    : [['mission', 'Dashboard', 'Understand today’s ministry.', 'home', ''], ['progress', 'My Progress', 'Your readiness and competencies.', 'chart', ''], ['announcements', 'Announcements', 'Ministry communication.', 'bell', 'cream'], [p.role === 'pastor' ? 'reports' : 'report', 'Reports', 'Capture ministry activity.', 'file', 'cream'], ['people', 'Membership', 'The people you reach.', 'users', 'green'], ['prayer', 'Prayer Wall', 'Requests from your members.', 'msg', ''], ['board', 'Ask & Share', 'Anonymous posts from the church.', 'talk', 'cream'], ['devotion', 'Daily Devotion', 'Verse, Bible reading and prayer.', 'bible', 'cream'], ['sermons', 'Sermon Notes', 'Sunday messages and your notes.', 'book', ''], ['events', 'Events', 'Services and programmes.', 'cal', ''], ['health', 'Ministry Health', 'Attendance, offering and busing.', 'chart', ''], ['guide', 'Field Guide', 'Find policies and resources.', 'book', 'cream']];
  if (p.role === 'pastor') items.splice(1, 0, ['admin', 'Church Admin', 'Bacentas, roles and church settings.', 'gear', 'green']);
  return items.map(([t, title, d, i, cls]) => `<button class="nav-card" data-go="${t}"><span class="chev">${ic('chev')}</span><div class="tile-ico ${cls}">${ic(i)}</div><div class="stack"><strong style="font-size:17px">${title}</strong><span class="small muted">${d}</span></div></button>`).join('');
}

function missionScreen() {
  const p = me(); const first = p.name.split(' ')[0]; const groups = myGroups();
  if (p.role === 'member') return hubScreen();
  if (!groups.length) {
    return `${header('Mission')}<section class="card"><h2>${p.role === 'pastor' ? 'Set up your church' : 'No bacenta assigned yet'}</h2>
      <p class="muted">${p.role === 'pastor' ? 'Add your first bacenta and choose its leader. Then leaders can record attendance and send weekly reports.' : 'Ask your pastor to assign you to a bacenta in Church Admin.'}</p>
      ${p.role === 'pastor' ? '<div><button class="btn" data-go="admin">Open church admin</button></div>' : ''}</section>`;
  }
  const pendingAtt = groups.filter(g => !attendanceFor(g));
  const pendingRep = groups.filter(g => !reportFor(g));
  const nextComp = COMPETENCIES.leader.find(([k, , of]) => (p.progress?.[k] || 0) < of);
  let alert = '';
  if (pendingAtt.length) {
    const count = S.members.filter(m => pendingAtt.includes(m.group)).length;
    alert = `<div class="alert" role="alert"><div class="row">${ic('alert')}<div class="stack"><strong>Church attendance not recorded</strong>
      <span class="small">${p.role === 'pastor' ? `${pendingAtt.length} bacenta(s) have not recorded attendance this week.` : `Review and save church attendance for your ${count} registered member(s).`}</span></div></div>
      <div><button class="btn sm" data-go="attendance">Open attendance</button></div></div>`;
  }
  let reportCard;
  if (p.role === 'leader') {
    const r = reportFor(p.group);
    reportCard = `<section class="card"><div class="row between"><span class="small muted">${THIS_WEEK} report</span>${r ? '<span class="pill ok">Submitted</span>' : '<span class="pill due">Due</span>'}</div>
      <div class="stack"><strong style="font-size:18px">${r ? 'Report received' : `Due ${sundayLabel()}, 9:00pm`}</strong>
      <span class="small muted">${r ? `${r.att} attended · ${money(r.off)} offering · ${r.bus} bused` : 'Your report for this week has not been submitted yet.'}</span></div></section>`;
  } else {
    reportCard = `<section class="card"><div class="row between"><span class="small muted">${THIS_WEEK} reports</span><span class="pill ${pendingRep.length ? 'due' : 'ok'}">${groups.length - pendingRep.length}/${groups.length} in</span></div>
      <div class="list">${S.groups.map(g => { const r = reportFor(g.id); return `<div class="li"><div class="stack grow"><strong>${esc(g.name)}</strong><span class="small muted">${esc(g.leaderName || 'No leader yet')}${g.zone ? ' · ' + esc(g.zone) : ''}</span></div>${r ? `<span class="pill ok">${r.att} att.</span>` : '<span class="pill due">Pending</span>'}</div>`; }).join('')}</div></section>`;
  }
  const todos = [];
  if (pendingAtt.length) todos.push(['Record church attendance', p.role === 'pastor' ? `${pendingAtt.map(groupName).join(', ')} still pending.` : 'Not recorded for this week yet.', false]);
  if (p.role === 'leader') todos.push(['Submit this week’s report', reportFor(p.group) ? 'Done. Thank you!' : 'No report submitted for the current week yet.', !!reportFor(p.group)]);
  if (p.role === 'pastor' && pendingRep.length) todos.push(['Follow up on missing reports', `${pendingRep.length} bacenta(s) have not submitted.`, false]);
  if (nextComp) todos.push([`Focus next on ${nextComp[1]}`, `Current stage: ${(p.progress?.[nextComp[0]] || 0) === 0 ? 'not started' : `step ${p.progress[nextComp[0]]} of ${nextComp[2]}`}.`, false]);
  const newMembers = S.members.filter(m => groups.includes(m.group) && m.status === 'New').length;
  if (newMembers) todos.push([`Welcome ${newMembers} new member${newMembers > 1 ? 's' : ''}`, 'Call or visit them before Sunday.', false]);
  if (p.role === 'pastor' && S.flags.length) todos.push([`Review ${S.flags.length} reported post${S.flags.length > 1 ? 's' : ''}`, 'Open Church Admin to review Ask & Share reports.', false]);
  const goal = S.settings.campaignGoal, reached = S.settings.campaignReached || 0;
  return `${alert}${reportCard}
    <div class="stack" style="gap:10px"><span class="eyebrow gold">${esc(churchName())}</span><h2 class="serif">Welcome back, ${esc(first)}</h2>
      <div class="row">${p.role === 'leader' ? `<button class="btn" data-go="report" ${reportFor(p.group) ? 'disabled' : ''}>${reportFor(p.group) ? 'Report submitted' : 'Submit report'}</button>` : '<button class="btn" data-go="reports">View reports</button>'}
      <button class="btn ghost" data-act="logout">Sign out</button><button class="icon-btn" data-act="theme" aria-label="Switch light or dark mode">${ic('sun')}</button></div></div>
    ${goal ? `<section class="card"><div class="row"><div class="tile-ico cream">${ic('flag')}</div><div class="stack"><strong>${esc(S.settings.campaignName || 'Outreach campaign')}</strong><span class="small muted">Outreach campaign · souls reached</span></div></div>
      <div class="progress"><i style="width:${Math.min(100, Math.round(reached / goal * 100))}%"></i></div>
      <div class="row between small"><span class="num"><strong>${reached.toLocaleString()}</strong> <span class="muted">of ${Number(goal).toLocaleString()}</span></span><span class="muted num">${Math.round(reached / goal * 100)}%</span></div></section>` : ''}
    <section class="card"><h2>This week needs your attention</h2>
      <ul class="todo">${todos.map(([t, d, done]) => `<li><span class="dot ${done ? 'done' : ''}"></span><div class="stack"><strong>${esc(t)}</strong><span class="small muted">${esc(d)}</span></div></li>`).join('') || '<li class="muted">You are all caught up.</li>'}</ul></section>
    ${birthdaysCard(groups)}
    ${last4Card(groups, p.role === 'pastor' ? 'Whole church' : 'My ministry')}`;
}
function birthdaysCard(groups) {
  const list = [];
  S.members.filter(m => groups.includes(m.group) && m.bday).forEach(m => { for (let i = 0; i < 7; i++) if (dayKey(i).slice(5) === m.bday) list.push([m, i]); });
  if (!list.length) return '';
  list.sort((a, b) => a[1] - b[1]);
  return `<section class="card"><h2>Birthdays this week</h2><div class="list">${list.map(([m, i]) => `<button class="li" data-member="${m.id}"><div class="avatar">${initials(m.name)}</div><div class="stack grow"><strong>${esc(m.name)}</strong><span class="small muted">${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'In ' + i + ' days'} · ${esc(m.phone || 'No phone')}</span></div>${ic('chev')}</button>`).join('')}</div></section>`;
}

/* ---------- screens: people & ministry ---------- */
function peopleScreen() {
  const p = me(); const groups = myGroups(); const q = peopleQuery.toLowerCase();
  const total = S.members.filter(m => groups.includes(m.group));
  const list = total.filter(m => (peopleFilter === 'All' || m.status === peopleFilter) && (!q || m.name.toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name));
  return `${header('Membership')}
    <div class="stats">
      <div class="stat"><b>${total.length}</b><span>Members</span></div>
      <div class="stat"><b style="color:var(--blue)">${total.filter(m => m.status === 'New').length}</b><span>New</span></div>
      <div class="stat"><b style="color:var(--red)">${total.filter(m => m.status === 'Inactive').length}</b><span>Need follow-up</span></div>
    </div>
    <div class="row" style="position:relative"><span style="position:absolute;left:12px;color:var(--muted);display:flex">${ic('search')}</span>
      <input class="input" id="people-search" type="search" placeholder="Search members" value="${esc(peopleQuery)}" style="padding-left:40px" aria-label="Search members"></div>
    <div class="chips">${['All', 'Active', 'New', 'Inactive'].map(f => `<button class="chip" data-filter="${f}" aria-pressed="${f === peopleFilter}">${f}</button>`).join('')}
      ${groups.length ? '<button class="chip" data-sheet="addMember" style="margin-left:auto">+ Add member</button>' : ''}</div>
    <section class="card" style="padding-block:6px"><div class="list">${list.map(m => `<button class="li" data-member="${m.id}"><div class="avatar">${initials(m.name)}</div><div class="stack grow"><strong class="ellipsis">${esc(m.name)}</strong><span class="small muted ellipsis">${p.role === 'pastor' ? esc(groupName(m.group)) + ' · ' : ''}${esc(m.phone || 'No phone')}</span></div>${statusPill(m.status)}</button>`).join('')
      || empty(total.length ? 'No members match this search.' : groups.length ? 'No members yet. Add the people in your bacenta.' : 'Add a bacenta in Church Admin first.')}</div></section>`;
}

function attendanceScreen() {
  const p = me(); const groups = myGroups();
  if (!groups.length) return `${header('Church attendance', 'mission')}${empty('No bacenta assigned yet.')}`;
  const g = p.role === 'pastor' ? (groups.includes(attGroup) ? attGroup : groups[0]) : p.group;
  attGroup = g;
  const members = S.members.filter(m => m.group === g && m.status !== 'Inactive').sort((a, b) => a.name.localeCompare(b.name));
  const saved = attendanceFor(g);
  if (!attDraft || attDraft.g !== g) attDraft = { g, ids: new Set(saved?.present || []) };
  const sel = attDraft.ids;
  return `${header('Church attendance', 'mission')}
    <p class="muted">Sunday service · ${THIS_WEEK} · tap each member who attended.</p>
    ${p.role === 'pastor' ? `<div class="chips">${S.groups.map(x => `<button class="chip" data-attgroup="${x.id}" aria-pressed="${x.id === g}">${esc(x.name)}${attendanceFor(x.id) ? ' ✓' : ''}</button>`).join('')}</div>` : ''}
    <section class="card" style="padding-block:6px"><div class="list">${members.map(m => `<button class="li" data-mark="${m.id}" aria-pressed="${sel.has(m.id)}"><span class="check ${sel.has(m.id) ? 'on' : ''}">${ic('check')}</span><span class="grow">${esc(m.name)}</span>${m.status === 'New' ? statusPill('New') : ''}</button>`).join('') || empty('Add members to this bacenta first.', '<button class="btn sm" data-go="people">Open membership</button>')}</div></section>
    <div class="row between"><span class="num"><strong>${sel.size}</strong> <span class="muted">of ${members.length} present</span></span><button class="btn" data-act="saveAtt" ${members.length ? '' : 'disabled'}>${saved ? 'Update attendance' : 'Save attendance'}</button></div>`;
}

function reportScreen() {
  const p = me();
  if (p.role === 'pastor') return reportsScreen();
  if (!p.group) return `${header('Weekly report')}${empty('Ask your pastor to assign your bacenta before sending reports.')}`;
  const r = reportFor(p.group); const att = attendanceFor(p.group);
  const history = S.reports.filter(x => x.group === p.group).sort((a, b) => b.week.localeCompare(a.week));
  const form = r ? `<section class="card"><div class="row between"><h2>${THIS_WEEK} report</h2><span class="pill ok">Submitted</span></div><p class="muted">${r.att} attended · ${money(r.off)} offering · ${r.bus} bused · ${r.souls || 0} souls won</p></section>`
    : `<form id="report-form" class="card" novalidate><div class="row between"><h2>${THIS_WEEK} weekly report</h2><span class="pill due">Due Sun</span></div>
      ${att ? '' : '<p class="small" style="color:var(--warn-fg)">Attendance not recorded yet. <button type="button" class="link" data-go="attendance">Record it first</button></p>'}
      <div class="grid2">
        <div class="field"><label for="r-att">Fellowship attendance</label><input class="input num" id="r-att" type="number" min="0" inputmode="numeric" value="${att ? att.present.length : ''}"></div>
        <div class="field"><label for="r-off">Offering (${CHURCH.currency})</label><input class="input num" id="r-off" type="number" min="0" step="0.01" inputmode="decimal"></div>
        <div class="field"><label for="r-bus">Sunday busing</label><input class="input num" id="r-bus" type="number" min="0" inputmode="numeric"></div>
        <div class="field"><label for="r-souls">Souls won</label><input class="input num" id="r-souls" type="number" min="0" max="500" inputmode="numeric" value="0"></div>
      </div>
      <div class="field"><label for="r-notes">Notes for the pastor</label><textarea class="input" id="r-notes" placeholder="Testimonies, members who need a visit, challenges…"></textarea></div>
      <p class="err" id="r-err" hidden></p><button class="btn block" type="submit">Submit report</button></form>`;
  return `${header('Weekly report')}${form}
    <section class="card"><h2>Past reports</h2><div class="list">${history.map(h => `<div class="li"><div class="tile-ico" style="width:38px;height:38px">${ic('file')}</div><div class="stack grow"><strong>${h.week}</strong><span class="small muted num">${h.att} att. · ${money(h.off)} · ${h.bus} bused</span></div><span class="pill ok">Sent</span></div>`).join('') || empty('Your sent reports will appear here.')}</div></section>`;
}
function reportsScreen() {
  const rows = S.groups.map(g => ({ g, r: reportFor(g.id), a: attendanceFor(g.id) }));
  const recent = S.reports.slice().sort((a, b) => b.week.localeCompare(a.week) || ms(b.at) - ms(a.at)).slice(0, 12);
  return `${header('Reports', 'home')}
    <section class="card"><div class="row between"><h2>This week · ${weekShort(THIS_WEEK)}</h2><span class="pill ${rows.every(x => x.r) ? 'ok' : 'due'}">${rows.filter(x => x.r).length}/${rows.length} submitted</span></div>
      <div class="list">${rows.map(({ g, r, a }) => `<div class="li"><div class="avatar">${initials(g.leaderName || g.name)}</div><div class="stack grow"><strong>${esc(g.name)}</strong><span class="small muted">${esc(g.leaderName || 'No leader')} · attendance ${a ? 'recorded' : 'not recorded'}</span></div>${r ? '<span class="pill ok">In</span>' : '<span class="pill due">Pending</span>'}</div>`).join('') || empty('Add bacentas in Church Admin.')}</div></section>
    <section class="card"><h2>Recent submissions</h2><div class="list">${recent.map(h => `<div class="li"><div class="stack grow"><strong>${esc(groupName(h.group))} · ${weekShort(h.week)}</strong><span class="small muted num">${h.att} att. · ${money(h.off)} · ${h.bus} bused · ${h.souls || 0} souls · by ${esc(h.byName || '')}</span>${h.notes ? `<span class="small">“${esc(h.notes)}”</span>` : ''}</div></div>`).join('') || empty('No reports yet.')}</div></section>`;
}
function healthScreen() {
  const p = me(); const groups = myGroups();
  const s = weekStats(groups); const last = s[2], prev = s[1];
  const d = prev.att ? Math.round((last.att - prev.att) / prev.att * 100) : 0;
  return `${header('Ministry health', p.role === 'pastor' ? null : 'home')}
    <section class="card"><span class="eyebrow">${weekShort(WEEKS[2])} vs ${weekShort(WEEKS[1])}</span>
      <div class="row"><b style="font-size:30px" class="num">${last.att}</b><span class="pill ${d >= 0 ? 'ok' : 'off'}">${d >= 0 ? '+' : ''}${d}% attendance</span></div>
      <p class="small muted">${s.reduce((a, x) => a + x.souls, 0)} souls won in the last 4 weeks · ${groups.filter(g => reportFor(g)).length} of ${groups.length} reports in this week</p></section>
    ${last4Card(groups, p.role === 'pastor' ? 'Whole church' : groupName(p.group))}
    ${p.role === 'pastor' ? `<section class="card"><h2>By bacenta · ${weekShort(WEEKS[2])}</h2><div class="list">${S.groups.map(g => { const r = reportFor(g.id, WEEKS[2]); return `<div class="li"><div class="stack grow"><strong>${esc(g.name)}</strong><span class="small muted">${esc(g.zone || '')}</span></div><span class="num small">${r ? `${r.att} att · ${money(r.off)}` : '–'}</span></div>`; }).join('')}</div></section>` : ''}`;
}

/* ---------- screens: church life ---------- */
function announcementsScreen() {
  const p = me(); const list = sortedAnns();
  return `${header('Announcements', 'home')}
    ${p.role !== 'member' ? `<button class="btn" data-sheet="announce">${ic('plus')} Post announcement</button>` : ''}
    <section class="card" style="padding-block:6px"><div class="list">${list.map(annItem).join('') || empty('No announcements yet.')}</div></section>`;
}
const upcomingEvents = () => S.events.filter(e => e.date >= todayKey()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
function eventsScreen() {
  const p = me(); const list = upcomingEvents(); const staff = p.role !== 'member';
  return `${header('Events', 'home')}
    ${staff ? `<button class="btn" data-sheet="event">${ic('plus')} Add event</button>` : ''}
    ${list.map(e => { const dp = dateParts(e.date); const going = (e.going || []).includes(uid()); return `<section class="card"><div class="row"><div class="date-block"><span>${dp.mon}</span><b>${dp.day}</b></div><div class="stack grow"><strong>${esc(e.title)}</strong><span class="small muted">${esc(e.time)} · ${esc(e.place)}</span><span class="small muted">${(e.going || []).length} attending</span></div></div>
      <div class="row" style="gap:8px"><button class="btn sm ${going ? 'ghost' : ''}" data-rsvp="${e.id}">${going ? `${ic('check')} Attending · tap to cancel` : 'I’ll be there'}</button>${staff ? delBtn('event:' + e.id) : ''}</div></section>`; }).join('') || empty('No upcoming events.')}`;
}
function givingScreen() {
  const list = S.giving.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const month = list.filter(g => (g.date || '').slice(0, 7) === todayKey().slice(0, 7)).reduce((a, g) => a + (g.amount || 0), 0);
  const year = list.filter(g => (g.date || '').slice(0, 4) === todayKey().slice(0, 4)).reduce((a, g) => a + (g.amount || 0), 0);
  const momo = S.settings.momo;
  return `${header('Giving', 'home')}
    <div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><b style="color:var(--green)">${money(month)}</b><span>This month</span></div><div class="stat"><b>${money(year)}</b><span>This year</span></div></div>
    ${momo ? `<section class="card"><div class="stack"><strong>Give by Mobile Money</strong><span class="small muted">${esc(S.settings.momoName || 'Church Mobile Money number')}</span></div>
      <div class="row between"><code style="font-size:17px;font-weight:700" id="momo">${esc(momo)}</code><button class="btn sm ghost" data-act="copyMomo">Copy</button></div></section>` : ''}
    <section class="card"><div class="row between"><h2>My giving record</h2><button class="btn sm" data-sheet="gift">Log a gift</button></div><p class="small muted">A private record for you. Only you can see it.</p>
      <div class="list">${list.map(g => `<div class="li"><div class="tile-ico green" style="width:38px;height:38px">${ic('heart')}</div><div class="stack grow"><strong>${esc(g.type)}</strong><span class="small muted">${esc(g.date)}</span></div><strong class="num">${money(g.amount)}</strong></div>`).join('') || empty('Gifts you log will appear here.')}</div></section>`;
}
function progressScreen() {
  const p = me(); const list = COMPETENCIES[p.role === 'member' ? 'member' : 'leader'];
  const done = list.filter(([k, , of]) => (p.progress?.[k] || 0) >= of).length;
  return `${header('My progress', 'home')}
    <section class="card"><span class="eyebrow">Readiness</span><div class="row"><b style="font-size:30px" class="num">${Math.round(done / list.length * 100)}%</b><span class="muted small">${done} of ${list.length} areas complete</span></div></section>
    ${list.map(([k, name, of]) => { const step = Math.min(of, p.progress?.[k] || 0); return `<section class="card"><div class="row between"><strong>${esc(name)}</strong>${step >= of ? '<span class="pill ok">Complete</span>' : step === 0 ? '<span class="pill">Not started</span>' : `<span class="pill new">Step ${step} of ${of}</span>`}</div>
      <div class="progress"><i style="width:${Math.round(step / of * 100)}%"></i></div>
      ${step < of ? `<div><button class="btn sm ghost" data-step="${k}">Mark next step done</button></div>` : ''}</section>`; }).join('')}`;
}
function guideScreen() {
  const q = guideQuery.toLowerCase(); const list = GUIDE.filter(([t, b]) => !q || (t + b).toLowerCase().includes(q));
  return `${header('Field guide', 'home')}
    <input class="input" id="guide-search" type="search" placeholder="Search policies and resources" value="${esc(guideQuery)}" aria-label="Search the field guide">
    ${list.map(([t, b]) => `<details class="card"><summary style="cursor:pointer;font-weight:700">${esc(t)}</summary><p class="muted" style="margin-top:8px">${esc(b)}</p></details>`).join('') || empty('Nothing matches that search.')}`;
}
function devotionScreen() {
  const p = me(); const d = dayDoc();
  const days = [...Array(7)].map((_, i) => { const dt = new Date(); dt.setDate(dt.getDate() + i - 6); return `<div><i class="${dayComplete(p, dayKey(i - 6)) ? 'on' : ''} ${i === 6 ? 'today' : ''}"></i><span>${dt.toLocaleDateString('en-GB', { weekday: 'short' })}</span></div>`; }).join('');
  const month = S.days.filter(x => x.id.slice(0, 7) === todayKey().slice(0, 7) && dayComplete(p, x.id)).length;
  return `${header('Daily devotion', p.role === 'member' ? null : 'home')}
    ${verseCard(true)}
    <div class="stats"><div class="stat"><b style="color:var(--green)">${streakOf(p)}</b><span>Day streak</span></div><div class="stat"><b style="color:var(--blue)">${month}</b><span>Days this month</span></div><div class="stat"><b style="color:var(--amber)">${planDay()}/21</b><span>John plan</span></div></div>
    <section class="card"><h2>Today’s tasks</h2>${taskList(p)}
      <form id="task-form" class="row" novalidate><input class="input grow" id="task-new" maxlength="80" placeholder="Add your own, e.g. Fast until noon" aria-label="New daily task"><button class="btn">Add</button></form>
      <span class="small muted">Tasks you add repeat every day. Your streak counts the main tasks.</span></section>
    <section class="card"><h2>Last 7 days</h2><div class="week">${days}</div></section>
    <section class="card"><h2>Prayer journal</h2><label class="small muted" for="dev-journal">What did God speak to you today?</label>
      <textarea class="input" id="dev-journal" placeholder="Write a few lines from your reading or prayer time…">${esc(d.journal)}</textarea>
      <div><button class="btn sm" data-act="saveJournal">Save journal</button></div><span class="small muted">Private. Only you can read your journal.</span></section>`;
}
function prayerScreen() {
  const p = me(); const list = S.prayers.slice().sort(newest); const open = list.filter(x => !x.answered).length;
  return `${header('Prayer wall', p.role === 'member' ? null : 'home')}
    <p class="muted">${open} open request${open === 1 ? '' : 's'} · ${list.length - open} answered. Tap “I prayed” so they know they are covered.</p>
    <button class="btn" data-sheet="prayer">${ic('plus')} New prayer request</button>
    ${list.map(x => { const mine = (x.prayed || []).includes(uid()); const own = x.by === uid(); return `<section class="card"><div class="row"><div class="avatar">${initials(x.name)}</div><div class="stack grow"><strong>${esc(x.name)}</strong><span class="small muted">${esc(groupName(x.group))} · ${fmt(x.createdAt)}</span></div>${x.answered ? '<span class="pill ok">Answered</span>' : ''}</div>
      <p style="white-space:pre-line">${esc(x.body)}</p>
      <div class="row between"><span class="small muted">${(x.prayed || []).length} prayed</span><div class="row" style="gap:8px;flex-wrap:wrap;justify-content:flex-end">${own && !x.answered ? `<button class="btn sm ghost" data-answered="${x.id}">Mark answered</button>` : ''}${own || p.role === 'pastor' ? delBtn('prayer:' + x.id) : ''}${x.answered ? '' : `<button class="btn sm ${mine ? 'ghost' : ''}" data-pray="${x.id}">${mine ? ic('check') + ' Prayed' : 'I prayed'}</button>`}</div></div></section>`; }).join('') || empty('No prayer requests yet.')}`;
}
function sermonsScreen() {
  const p = me(); const list = S.sermons.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `${header('Sermon notes', 'home')}
    ${p.role === 'pastor' ? `<button class="btn" data-sheet="sermon">${ic('plus')} Add sermon</button>` : ''}
    ${list.map(s => { const dp = dateParts(s.date); const note = S.notes.find(n => n.id === s.id)?.text || ''; return `<section class="card"><div class="row"><div class="date-block"><span>${dp.mon}</span><b>${dp.day}</b></div><div class="stack grow"><strong>${esc(s.title)}</strong><span class="small muted">${esc(s.preacher)} · ${esc(s.scripture)}</span></div></div>
      ${(s.points || []).length ? `<ul class="todo">${s.points.map(x => `<li><span class="dot"></span><span>${esc(x)}</span></li>`).join('')}</ul>` : ''}
      <label class="small muted" for="sn-${s.id}">My notes (private)</label><textarea class="input" id="sn-${s.id}" placeholder="What stood out to you?">${esc(note)}</textarea>
      <div class="row" style="gap:8px"><button class="btn sm ghost" data-savenote="${s.id}">Save notes</button>${p.role === 'pastor' ? delBtn('sermon:' + s.id) : ''}</div></section>`; }).join('') || empty('Sermons will appear here after Sunday.')}`;
}

/* ---------- Ask & Share ---------- */
const ownsPost = id => S.myPosts.some(o => o.id === id);
const topicPill = t => `<span class="pill ${t === 'Testimony' ? 'ok' : t === 'Need advice' ? 'new' : 'due'}">${esc(t)}</span>`;
function boardNotice() {
  const n = S.myPosts.reduce((a, o) => a + (S.priv[o.id]?.length || 0), 0);
  if (!n) return '';
  return `<section class="card"><div class="row"><div class="tile-ico cream">${ic('talk')}</div><div class="stack grow"><strong>${n} private message${n > 1 ? 's' : ''} on your anonymous posts</strong><span class="small muted">Only you can see ${n > 1 ? 'them' : 'it'}.</span></div><button class="btn sm" data-go="board">Read</button></div></section>`;
}
const replyHtml = r => `<div class="stack"><span class="small"><strong>${r.anon ? 'Anonymous' : esc(r.name)}</strong> <span class="muted">· ${fmt(r.createdAt)}</span></span><span class="small" style="white-space:pre-line">${esc(r.body)}</span></div>`;
function boardPost(x) {
  const p = me(); const mine = ownsPost(x.id); const sup = (x.support || []).includes(uid());
  const pub = S.replies.filter(r => r.postId === x.id).sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
  const priv = (S.priv[x.id] || []).slice().sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
  return `<section class="card"><div class="row"><div class="avatar">?</div><div class="stack grow"><strong>${mine ? 'You · posted anonymously' : 'Anonymous member'}</strong><span class="small muted">${fmt(x.createdAt)}</span></div>${topicPill(x.topic)}</div>
    <p style="white-space:pre-line">${esc(x.body)}</p>
    <div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn sm ${sup ? '' : 'ghost'}" data-support="${x.id}" aria-pressed="${sup}">${sup ? ic('check') + ' ' : ''}I’m with you · ${(x.support || []).length}</button>
      <button class="btn sm ghost" data-reply="${x.id}">Reply</button>
      ${mine ? delBtn('post:' + x.id) : `<button class="btn sm ghost" data-dm="${x.id}">Message privately</button><button class="btn sm ghost" data-sheetflag="${x.id}">Report</button><button class="btn sm ghost" data-hide="${x.id}">Hide</button>`}
      ${p.role === 'pastor' && !mine ? delBtn('remove:' + x.id, 'Remove') : ''}</div>
    ${pub.length ? `<div class="stack" style="gap:10px;border-top:1px solid var(--line);padding-top:12px">${pub.map(replyHtml).join('')}</div>` : ''}
    ${mine ? `<div class="card" style="background:var(--surface-2);gap:10px;padding:14px"><span class="eyebrow">Private messages for you · only you can see these</span>${priv.length ? priv.map(replyHtml).join('') : '<span class="small muted">No private messages yet.</span>'}</div>` : ''}</section>`;
}
function boardScreen() {
  const p = me(); const hidden = p.hidden || [];
  const live = S.board.filter(x => !x.removed && !hidden.includes(x.id)).sort(newest);
  const shown = live.filter(x => boardFilter === 'All' || (boardFilter === 'My posts' ? ownsPost(x.id) : x.topic === boardFilter));
  return `${header('Ask & Share', p.role === 'member' ? null : 'home')}
    <p class="muted">Post anonymously to ask for advice or share what you are going through. Your name is never stored with your post. The church can reply to everyone or send you a private message.</p>
    <button class="btn" data-sheet="post">${ic('plus')} Post anonymously</button>
    <div class="chips">${['All', ...TOPICS, 'My posts'].map(f => `<button class="chip" data-bfilter="${f}" aria-pressed="${f === boardFilter}">${f}</button>`).join('')}</div>
    ${shown.map(boardPost).join('') || empty('No posts here yet.')}
    <p class="small muted">If you or someone else is in danger, call ${esc(CHURCH.emergencyNumber)} or speak to a pastor straight away.</p>`;
}

/* ---------- admin (pastor) ---------- */
function adminScreen() {
  const st = S.settings; const roleOpts = r => ['member', 'leader', 'pastor'].map(x => `<option value="${x}" ${x === r ? 'selected' : ''}>${ROLE_LABEL[x]}</option>`).join('');
  const groupOpts = g => `<option value="">No bacenta</option>${S.groups.map(x => `<option value="${esc(x.id)}" ${x.id === g ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}`;
  const users = S.users.slice().sort((a, b) => a.name.localeCompare(b.name));
  return `${header('Church admin', 'home')}
    <form id="settings-form" class="card" novalidate><h2>Church details</h2>
      <div class="field"><label for="st-name">Church name</label><input class="input" id="st-name" value="${esc(st.churchName || CHURCH.name)}"></div>
      <div class="grid2"><div class="field"><label for="st-momo">Mobile Money number</label><input class="input" id="st-momo" value="${esc(st.momo || '')}" placeholder="024 000 0000"></div>
      <div class="field"><label for="st-momoname">Account name</label><input class="input" id="st-momoname" value="${esc(st.momoName || '')}"></div></div>
      <div class="field"><label for="st-camp">Outreach campaign name</label><input class="input" id="st-camp" value="${esc(st.campaignName || '')}" placeholder="Road to 10,000"></div>
      <div class="grid2"><div class="field"><label for="st-goal">Campaign goal</label><input class="input num" id="st-goal" type="number" min="0" value="${esc(st.campaignGoal || '')}"></div>
      <div class="field"><label for="st-reached">Souls reached so far</label><input class="input num" id="st-reached" type="number" min="0" value="${esc(st.campaignReached || 0)}"></div></div>
      <button class="btn">Save church details</button></form>
    <section class="card"><h2>Bacentas</h2>
      <div class="list">${S.groups.map(g => `<div class="li"><div class="stack grow"><strong>${esc(g.name)}</strong><span class="small muted">${esc(g.zone || 'No area')} · ${esc(g.leaderName || 'No leader yet')}</span></div>${delBtn('group:' + g.id)}</div>`).join('') || '<p class="small muted">No bacentas yet.</p>'}</div>
      <form id="group-form" class="stack" style="gap:10px" novalidate><div class="grid2"><input class="input" id="gr-name" placeholder="Bacenta name" aria-label="Bacenta name"><input class="input" id="gr-zone" placeholder="Area, e.g. Kasoa" aria-label="Area"></div><button class="btn ghost">Add bacenta</button></form></section>
    <section class="card"><h2>People & roles</h2><p class="small muted">Make someone a leader by choosing Bacenta Leader and their bacenta.</p>
      ${users.map(u => `<form class="stack role-form" data-user="${u.id}" style="gap:8px;border-top:1px solid var(--line);padding-top:12px" novalidate><div class="stack"><strong>${esc(u.name)}${u.id === uid() ? ' (you)' : ''}</strong><span class="small muted">${esc(u.email || '')}${u.phone ? ' · ' + esc(u.phone) : ''}</span></div>
        <div class="user-row"><select class="input" name="role" aria-label="Role" ${u.id === uid() ? 'disabled' : ''}>${roleOpts(u.role)}</select><select class="input" name="group" aria-label="Bacenta">${groupOpts(u.group)}</select><button class="btn sm">Save</button></div></form>`).join('')}</section>
    <section class="card"><h2>Reported posts</h2>${S.flags.length ? `<div class="list">${S.flags.map(f => { const post = S.board.find(b => b.id === f.postId); return `<div class="li" style="align-items:flex-start"><div class="stack grow"><span class="small"><strong>Reason:</strong> ${esc(f.reason)}</span><span class="small muted">${post ? esc(post.body.slice(0, 140)) : 'Post already deleted'}${post?.removed ? ' · removed' : ''}</span>
      <div class="row" style="gap:8px;margin-top:6px">${post && !post.removed ? delBtn('remove:' + post.id, 'Remove post') : ''}<button class="btn sm ghost" data-dismissflag="${f.id}">Dismiss</button></div></div></div>`; }).join('')}</div>` : '<p class="small muted">Nothing reported.</p>'}</section>`;
}

function moreScreen() {
  const p = me();
  const links = p.role === 'member'
    ? [['devotion', 'Daily devotion', 'bible'], ['board', 'Ask & Share', 'talk'], ['prayer', 'Prayer wall', 'msg'], ['sermons', 'Sermon notes', 'book'], ['events', 'Events', 'cal'], ['progress', 'My progress', 'target'], ['giving', 'Giving', 'heart'], ['announcements', 'Announcements', 'bell'], ['guide', 'Field guide', 'book']]
    : [['devotion', 'Daily devotion', 'bible'], ['board', 'Ask & Share', 'talk'], ['prayer', 'Prayer wall', 'msg'], ['sermons', 'Sermon notes', 'book'], ['announcements', 'Announcements', 'bell'], ['attendance', 'Church attendance', 'clip'], [p.role === 'pastor' ? 'reports' : 'report', 'Reports', 'file'], ['health', 'Ministry health', 'chart'], ['events', 'Events', 'cal'], ['giving', 'Giving', 'heart'], ['progress', 'My progress', 'target'], ['guide', 'Field guide', 'book']];
  if (p.role === 'pastor') links.unshift(['admin', 'Church admin', 'gear']);
  const ios = isIOS && !isStandalone();
  return `${header('More')}
    <section class="card"><div class="row"><div class="avatar" style="width:52px;height:52px;font-size:16px">${initials(p.name)}</div><div class="stack grow"><strong style="font-size:17px">${esc(p.name)}</strong><span class="small muted">${ROLE_LABEL[p.role]}${p.group ? ' · ' + esc(groupName(p.group)) : ''}</span><span class="small muted">${esc(p.email || S.user.email)}</span></div><button class="btn sm ghost" data-sheet="profile">Edit</button></div></section>
    ${installEvt ? `<button class="btn" data-act="install">${ic('download')} Install the app on this phone</button>` : ios ? '<section class="card"><strong>Install on iPhone</strong><span class="small muted">Tap the Share button in Safari, then “Add to Home Screen”.</span></section>' : ''}
    <section class="card" style="padding-block:6px"><div class="list">
      ${links.map(([t, l, i]) => `<button class="li" data-go="${t}">${ic(i)}<span class="grow">${l}</span>${ic('chev')}</button>`).join('')}
      <button class="li" data-act="theme">${ic('sun')}<span class="grow">Switch light / dark</span></button>
      <button class="li danger" data-act="logout">${ic('out')}<span class="grow">Sign out</span></button>
    </div></section>
    <section class="card"><h2>Delete account</h2><p class="small muted">Removes your profile, devotion history, notes and giving record. Anonymous posts stay anonymous.</p><div>${delBtn('account', 'Delete my account')}</div></section>
    ${credit}`;
}

/* ---------- sheets ---------- */
function sheetHtml() {
  const p = me(); let body = '';
  const t = sheet.type;
  if (t === 'quick') {
    const acts = p.role === 'member'
      ? [['go:devotion', 'Today’s devotion', 'bible'], ['post', 'Post anonymously', 'talk'], ['prayer', 'Send a prayer request', 'msg'], ['gift', 'Log a gift', 'heart'], ['go:events', 'RSVP to an event', 'cal']]
      : [['go:devotion', 'Today’s devotion', 'bible'], ['post', 'Post anonymously', 'talk'], ['go:attendance', 'Record attendance', 'clip'], [p.role === 'leader' ? 'go:report' : 'go:reports', p.role === 'leader' ? 'Submit weekly report' : 'Review reports', 'file'], ['announce', 'Post announcement', 'bell'], ['addMember', 'Add a member', 'users']];
    body = `<h2>Quick actions</h2><div class="list">${acts.map(([a, l, i]) => `<button class="li" ${a.startsWith('go:') ? `data-go="${a.slice(3)}"` : `data-sheet="${a}"`}><div class="tile-ico" style="width:38px;height:38px">${ic(i)}</div><span class="grow">${l}</span>${ic('chev')}</button>`).join('')}</div>`;
  } else if (t === 'verse') {
    const [ref, text] = verseOfDay();
    body = `<div class="stack" style="gap:8px;align-items:center;text-align:center"><div class="brand-mark">${ic('bible')}</div><span class="eyebrow gold">Verse of the day · ${esc(todayLabel())}</span></div>
      <blockquote style="margin:0;font-family:var(--display);font-size:22px;line-height:1.5;text-align:center">“${esc(text)}”</blockquote>
      <p style="text-align:center;font-weight:700;color:var(--amber)">${esc(ref)} · KJV</p>
      <button class="btn block" data-act="amen">Amen</button><button class="btn ghost block" data-act="amenDevotion">Start today’s devotion</button>`;
  } else if (t === 'member') {
    const m = S.members.find(x => x.id === sheet.id);
    if (!m) { sheet = null; return ''; }
    const fus = S.followups.filter(f => f.member === m.id).sort(newest);
    body = `<div class="row"><div class="avatar" style="width:52px;height:52px;font-size:16px">${initials(m.name)}</div><div class="stack grow"><h2>${esc(m.name)}</h2><span class="small muted">${esc(groupName(m.group))} · joined ${esc(m.joined || '')}</span></div>${statusPill(m.status)}</div>
      <div class="card" style="background:var(--surface-2)"><span class="small muted">Phone</span><strong style="user-select:all" class="num">${esc(m.phone || 'No phone yet')}</strong>${m.bday ? `<span class="small muted">Birthday: ${esc(new Date('2000-' + m.bday + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }))}</span>` : ''}</div>
      <div class="chips">${['Active', 'New', 'Inactive'].map(s => `<button class="chip" data-setstatus="${s}" aria-pressed="${m.status === s}">${s}</button>`).join('')}</div>
      <h2>Follow-up</h2>${fus.length ? `<div class="list">${fus.map(f => `<div class="li" style="align-items:flex-start"><span class="pill">${esc(f.type)}</span><div class="stack grow"><span class="small">${esc(f.note)}</span><span class="small muted">${esc(f.byName)} · ${fmt(f.createdAt)}</span></div></div>`).join('')}</div>` : '<p class="small muted">No calls or visits logged yet.</p>'}
      <form id="fu-form" class="stack" style="gap:10px" novalidate><div class="grid2"><select class="input" id="fu-type" aria-label="Follow-up type"><option>Call</option><option>Visit</option><option>Text</option></select><input class="input" id="fu-note" placeholder="What happened?" aria-label="Follow-up note"></div><button class="btn">Log follow-up</button></form>
      <div>${delBtn('member:' + m.id, 'Remove from roster')}</div>`;
  } else if (t === 'addMember') {
    body = `<h2>Add a member</h2><form id="add-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="am-name">Full name</label><input class="input" id="am-name"></div>
      <div class="grid2"><div class="field"><label for="am-phone">Phone</label><input class="input" id="am-phone" inputmode="tel" placeholder="024 000 0000"></div>
      <div class="field"><label for="am-bday">Birthday (optional)</label><input class="input" id="am-bday" type="date"></div></div>
      ${p.role === 'pastor' ? `<div class="field"><label for="am-group">Bacenta</label><select class="input" id="am-group">${S.groups.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('')}</select></div>` : ''}
      <p class="err" id="am-err" hidden></p><button class="btn block">Add member</button></form>`;
  } else if (t === 'announce') {
    body = `<h2>Post announcement</h2><form id="ann-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="an-title">Title</label><input class="input" id="an-title" maxlength="120"></div>
      <div class="field"><label for="an-body">Message</label><textarea class="input" id="an-body"></textarea></div>
      <div class="field"><label for="an-aud">Who should see it</label><select class="input" id="an-aud">${p.role === 'pastor' ? '<option value="all">Everyone</option><option value="leaders">Leaders only</option>' + S.groups.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('') : `<option value="${esc(p.group)}">${esc(groupName(p.group))}</option>`}</select></div>
      ${p.role === 'pastor' ? '<label class="row small" for="an-pin" style="gap:8px"><input type="checkbox" id="an-pin"> Pin to the top</label>' : ''}
      <p class="err" id="an-err" hidden></p><button class="btn block">Post</button></form>`;
  } else if (t === 'prayer') {
    body = `<h2>Prayer request</h2><p class="small muted">Shared with ${p.role === 'pastor' ? 'the whole church' : esc(groupName(p.group)) + ' and the pastor'}, with your name.</p><form id="pr-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="pr-body">What should we pray about?</label><textarea class="input" id="pr-body"></textarea></div>
      <p class="err" id="pr-err" hidden></p><button class="btn block">Send request</button>
      <p class="small muted">Want to stay anonymous? <button type="button" class="link" data-sheet="post">Use Ask & Share instead.</button></p></form>`;
  } else if (t === 'gift') {
    body = `<h2>Log a gift</h2><form id="gift-form" class="stack" style="gap:12px" novalidate>
      <div class="grid2"><div class="field"><label for="gf-type">Type</label><select class="input" id="gf-type"><option>Tithe</option><option>Offering</option><option>Building Fund</option><option>Missions</option><option>Thanksgiving</option></select></div>
      <div class="field"><label for="gf-amt">Amount (${CHURCH.currency})</label><input class="input num" id="gf-amt" type="number" min="1" step="0.01" inputmode="decimal"></div></div>
      <div class="field"><label for="gf-date">Date</label><input class="input" id="gf-date" type="date" value="${todayKey()}"></div>
      <p class="err" id="gf-err" hidden></p><button class="btn block">Save</button></form>`;
  } else if (t === 'event') {
    body = `<h2>Add event</h2><form id="event-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="ev-title">Title</label><input class="input" id="ev-title" maxlength="100"></div>
      <div class="grid2"><div class="field"><label for="ev-date">Date</label><input class="input" id="ev-date" type="date" value="${todayKey()}"></div><div class="field"><label for="ev-time">Time</label><input class="input" id="ev-time" type="time" value="08:00"></div></div>
      <div class="field"><label for="ev-place">Place</label><input class="input" id="ev-place" placeholder="Main Auditorium"></div>
      <p class="err" id="ev-err" hidden></p><button class="btn block">Add event</button></form>`;
  } else if (t === 'sermon') {
    body = `<h2>Add sermon</h2><form id="sermon-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="sm-title">Title</label><input class="input" id="sm-title"></div>
      <div class="grid2"><div class="field"><label for="sm-date">Date</label><input class="input" id="sm-date" type="date" value="${todayKey()}"></div><div class="field"><label for="sm-scripture">Scripture</label><input class="input" id="sm-scripture" placeholder="John 10:11"></div></div>
      <div class="field"><label for="sm-preacher">Preacher</label><input class="input" id="sm-preacher" value="${esc(p.name)}"></div>
      <div class="field"><label for="sm-points">Main points (one per line)</label><textarea class="input" id="sm-points"></textarea></div>
      <p class="err" id="sm-err" hidden></p><button class="btn block">Add sermon</button></form>`;
  } else if (t === 'post') {
    body = `<h2>Post anonymously</h2><p class="small muted">Your name is never stored with the post, so nobody can see who wrote it, including leaders. Everyone in the church can read it, reply, or message you privately.</p>
      <form id="post-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="po-topic">What kind of post is this?</label><select class="input" id="po-topic">${TOPICS.map(x => `<option>${x}</option>`).join('')}</select></div>
      <div class="field"><label for="po-body">What’s on your heart?</label><textarea class="input" id="po-body" maxlength="3000" placeholder="Ask a question or share what you are going through…"></textarea></div>
      <p class="small muted">Please don’t name other people. Posts that break the guidelines can be removed.</p>
      <p class="err" id="po-err" hidden></p><button class="btn block">Post anonymously</button></form>`;
  } else if (t === 'reply') {
    const x = S.board.find(b => b.id === sheet.id); if (!x) { sheet = null; return ''; }
    body = `<h2>${sheet.private ? 'Send privately to the poster' : 'Reply to everyone'}</h2>
      <p class="small muted">${sheet.private ? 'Only the person who posted will see this message.' : 'Your reply is shown under the post for the whole church.'}</p>
      <div class="card" style="background:var(--surface-2);padding:14px"><p class="small">${esc(x.body.length > 160 ? x.body.slice(0, 160) + '…' : x.body)}</p></div>
      <form id="reply-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="rp-body">Your message</label><textarea class="input" id="rp-body" maxlength="2000" placeholder="${sheet.private ? 'A word of advice, a scripture, an offer to help…' : 'Encourage them…'}"></textarea></div>
      <label class="row small" for="rp-anon" style="gap:8px"><input type="checkbox" id="rp-anon"> Send without my name</label>
      <p class="err" id="rp-err" hidden></p><button class="btn block">${sheet.private ? 'Send privately' : 'Post reply'}</button></form>`;
  } else if (t === 'flag') {
    body = `<h2>Report this post</h2><p class="small muted">The pastor will review it. The poster won’t know who reported it.</p><form id="flag-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="fl-reason">What’s wrong?</label><select class="input" id="fl-reason"><option>Names or targets someone</option><option>Hurtful or abusive</option><option>Someone may be in danger</option><option>Spam or off-topic</option><option>Something else</option></select></div>
      <button class="btn block">Send report</button></form>`;
  } else if (t === 'profile') {
    body = `<h2>Edit profile</h2><form id="profile-form" class="stack" style="gap:12px" novalidate>
      <div class="field"><label for="pf-name">Full name</label><input class="input" id="pf-name" value="${esc(p.name)}"></div>
      <div class="field"><label for="pf-phone">Phone</label><input class="input" id="pf-phone" inputmode="tel" value="${esc(p.phone || '')}"></div>
      <p class="small muted">To change your bacenta or role, ask your pastor.</p>
      <p class="err" id="pf-err" hidden></p><button class="btn block">Save</button></form>`;
  }
  return `<div class="scrim" data-act="close"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><div class="row between"><span></span><button class="icon-btn" data-act="close" aria-label="Close">${ic('x')}</button></div>${body}</div></div>`;
}

/* ---------- render ---------- */
const SCREENS = { home: hubScreen, mission: missionScreen, devotion: devotionScreen, prayer: prayerScreen, sermons: sermonsScreen, board: boardScreen, people: peopleScreen, attendance: attendanceScreen, report: reportScreen, reports: reportsScreen, health: healthScreen, announcements: announcementsScreen, events: eventsScreen, giving: givingScreen, progress: progressScreen, guide: guideScreen, more: moreScreen, admin: adminScreen };
const STAFF_ONLY = ['mission', 'people', 'attendance', 'report', 'reports', 'health'];
function render() {
  // Keep typing focus, unsaved field values and sheet scroll when live data re-renders the page.
  const active = document.activeElement; const focused = active?.id;
  const sel = focused && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
  const drafts = {}; root.querySelectorAll('textarea[id], input[id]:not([type=checkbox]), select[id]').forEach(el => { if (el.dataset.dirty) drafts[el.id] = el.value; });
  const sheetScroll = root.querySelector('.sheet')?.scrollTop;
  root.innerHTML = screenHtml();
  Object.entries(drafts).forEach(([id, v]) => { const el = document.getElementById(id); if (el) { el.value = v; el.dataset.dirty = '1'; } });
  if (sheetScroll) { const s = root.querySelector('.sheet'); if (s) s.scrollTop = sheetScroll; }
  if (focused) { const el = document.getElementById(focused); if (el) { el.focus(); try { if (sel && sel[0] != null) el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
}
function screenHtml() {
  if (!configured) return setupScreen();
  if (!S.user) return loginScreen();
  if (recovery) return newPasswordScreen();
  if (!S.profileLoaded || (creatingProfile && !S.profile)) return '<div class="loading">Loading your ministry…</div>';
  if (!S.profile) return profileSetupScreen();
  const p = me(); const tabs = TABS[p.role] || TABS.member;
  if (!SCREENS[tab] || (p.role === 'member' && STAFF_ONLY.includes(tab)) || (tab === 'admin' && p.role !== 'pastor')) tab = 'home';
  const active = tabs.some(t => t[0] === tab) ? tab : (['attendance', 'reports', 'report', 'health'].includes(tab) && tabs.some(t => t[0] === 'mission') ? 'mission' : 'home');
  return `<main class="app">${SCREENS[tab]()}</main>
    <button class="fab" data-sheet="quick" aria-label="Quick actions">${ic('plus')}</button>
    <nav class="tabbar" aria-label="Main"><div class="tabbar-in">${tabs.map(([t, l, i]) => `<button class="tab" data-go="${t}" ${t === active ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span></button>`).join('')}</div></nav>
    ${sheet ? sheetHtml() : ''}`;
}

/* ---------- actions ---------- */
const val = id => (document.getElementById(id)?.value || '').trim();
const orNull = v => v || null;

async function performDelete(key) {
  const [kind, id] = key.split(/:(.*)/s);
  confirmKey = null;
  const del = (table, k, msg) => run(sb.from(table).delete().eq('id', id), msg, k);
  if (kind === 'ann') return del('announcements', 'announcements', 'Announcement deleted');
  if (kind === 'event') return del('events', 'events', 'Event deleted');
  if (kind === 'prayer') return del('prayers', 'prayers', 'Prayer request deleted');
  if (kind === 'sermon') return del('sermons', 'sermons', 'Sermon deleted');
  if (kind === 'group') return del('groups', 'groups', 'Bacenta deleted');
  if (kind === 'post') return del('board', 'board', 'Your post was deleted');
  if (kind === 'remove') return run(sb.from('board').update({ removed: true }).eq('id', id), 'Post removed from Ask & Share', 'board');
  if (kind === 'member') { sheet = null; return del('members', 'members', 'Removed from roster'); }
  if (kind === 'account') {
    if (await run(sb.rpc('delete_my_account'), 'Your account has been deleted')) await sb.auth.signOut();
  }
}

root.addEventListener('change', e => { if (e.target.id) e.target.dataset.dirty = '1'; });
root.addEventListener('input', e => {
  const el = e.target; if (el.id) el.dataset.dirty = '1';
  if (el.id === 'people-search') { peopleQuery = el.value; render(); }
  if (el.id === 'guide-search') { guideQuery = el.value; render(); }
});

root.addEventListener('click', async e => {
  const t = e.target.closest('button, .scrim'); if (!t) return;
  if (t.classList.contains('scrim') && e.target !== t) return;
  const d = t.dataset;
  if (t.type === 'submit' && t.closest('form')) return;
  if (d.auth) { authMode = d.auth; authNotice = ''; return render(); }
  if (d.del) { if (confirmKey !== d.del) { confirmKey = d.del; return render(); } return performDelete(d.del); }
  if (d.go) return go(d.go);
  if (d.sheet) return openSheet({ type: d.sheet });
  if (d.sheetflag) return openSheet({ type: 'flag', id: d.sheetflag });
  if (d.member) return openSheet({ type: 'member', id: d.member });
  if (d.filter) { peopleFilter = d.filter; return render(); }
  if (d.bfilter) { boardFilter = d.bfilter; return render(); }
  if (d.attgroup) { attGroup = d.attgroup; attDraft = null; return render(); }
  if (d.mark) { const s = attDraft.ids; s.has(d.mark) ? s.delete(d.mark) : s.add(d.mark); return render(); }
  if (d.setstatus) return run(sb.from('members').update({ status: d.setstatus }).eq('id', sheet.id), `Marked as ${d.setstatus}`, 'members');
  if (d.rsvp) { const ev = S.events.find(x => x.id === d.rsvp); const going = ev.going.includes(uid()); return run(sb.rpc('toggle_going', { e: ev.id }), going ? 'RSVP cancelled' : `See you at ${ev.title}`, 'events'); }
  if (d.step) {
    const of = (COMPETENCIES[me().role === 'member' ? 'member' : 'leader'].find(c => c[0] === d.step) || [])[2] || 1;
    const next = Math.min(of, (me().progress[d.step] || 0) + 1);
    return run(sb.from('profiles').update({ progress: { ...me().progress, [d.step]: next } }).eq('id', uid()), next >= of ? 'Area complete' : 'Progress saved', 'profile');
  }
  if (d.task) {
    const day = dayDoc(); const done = day.done.includes(d.task);
    const next = done ? day.done.filter(x => x !== d.task) : [...day.done, d.task];
    const ok = await run(sb.from('days').upsert({ uid: uid(), date: todayKey(), done: next, journal: day.journal || '' }, { onConflict: 'uid,date' }), null, 'days');
    if (ok) toast(done ? 'Task unchecked' : tasksFor(me()).every(x => next.includes(x.id)) ? 'All done for today. Well done!' : 'Task completed');
    return;
  }
  if (d.deltask) return run(sb.from('profiles').update({ custom_tasks: me().customTasks.filter(x => x.id !== d.deltask) }).eq('id', uid()), 'Task removed', 'profile');
  if (d.pray) { const x = S.prayers.find(y => y.id === d.pray); const mine = x.prayed.includes(uid()); return run(sb.rpc('toggle_prayed', { p: x.id }), mine ? 'Prayer mark removed' : `Thank you for praying for ${x.name.split(' ')[0]}`, 'prayers'); }
  if (d.answered) return run(sb.from('prayers').update({ answered: true }).eq('id', d.answered), 'Praise God! Marked as answered', 'prayers');
  if (d.savenote) return run(sb.from('sermon_notes').upsert({ uid: uid(), sermon_id: d.savenote, text: document.getElementById('sn-' + d.savenote).value }, { onConflict: 'uid,sermon_id' }), 'Notes saved', 'notes');
  if (d.support) { const x = S.board.find(b => b.id === d.support); const on = x.support.includes(uid()); return run(sb.rpc('toggle_support', { p: x.id }), on ? 'Support removed' : 'They’ll know someone is with them', 'board'); }
  if (d.reply) return openSheet({ type: 'reply', id: d.reply, private: false });
  if (d.dm) return openSheet({ type: 'reply', id: d.dm, private: true });
  if (d.hide) return run(sb.from('profiles').update({ hidden: [...new Set([...me().hidden, d.hide])] }).eq('id', uid()), 'Post hidden for you', 'profile');
  if (d.dismissflag) return run(sb.from('flags').delete().eq('id', d.dismissflag), 'Report dismissed', 'flags');
  switch (d.act) {
    case 'close': if (sheet?.type === 'verse') markVerseSeen(); root.querySelectorAll('.sheet [data-dirty]').forEach(el => delete el.dataset.dirty); sheet = null; return render();
    case 'amen': markVerseSeen(); sheet = null; return render();
    case 'amenDevotion': markVerseSeen(); return go('devotion');
    case 'logout': sheet = null; return sb.auth.signOut();
    case 'forgot': {
      const email = val('au-email'); if (!email) return showErr('au-err', 'Type your email above, then tap “Forgot your password?” again.');
      return run(sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }), 'Password reset email sent. Check your inbox.');
    }
    case 'install': { const evt = installEvt; installEvt = null; await evt.prompt(); const c = await evt.userChoice.catch(() => null); if (c?.outcome !== 'accepted') installEvt = evt; return render(); }
    case 'installLater': try { localStorage.setItem('shepherd-install-later', todayKey()); } catch (err) {} return render();
    case 'theme': {
      const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      const next = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next;
      try { localStorage.setItem('shepherd-theme', next); } catch (err) {} return;
    }
    case 'saveJournal': return run(sb.from('days').upsert({ uid: uid(), date: todayKey(), done: dayDoc().done, journal: val('dev-journal') }, { onConflict: 'uid,date' }), 'Journal saved', 'days');
    case 'saveAtt': {
      const { g, ids } = attDraft;
      const ok = await run(sb.from('attendance').upsert({ group_id: g, week: THIS_WEEK, present: [...ids], by: uid(), at: new Date().toISOString() }, { onConflict: 'group_id,week' }), `Attendance saved · ${ids.size} present`, 'attendance');
      if (ok) go(me().role === 'leader' && !reportFor(g) ? 'report' : 'mission');
      return;
    }
    case 'copyMomo': {
      const el = document.getElementById('momo');
      navigator.clipboard?.writeText(el.textContent).then(() => toast('Number copied'), () => { getSelection().selectAllChildren(el); toast('Number selected. Copy it from here.'); });
      return;
    }
  }
});

root.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target; lastOk = false;
  await handleSubmit(f);
  // After a successful send, empty the form if it is still on screen (settings keep their values).
  const nf = lastOk && f.id && f.id !== 'settings-form' ? document.getElementById(f.id) : null;
  if (nf) { nf.querySelectorAll('[data-dirty]').forEach(el => delete el.dataset.dirty); nf.reset(); }
});
async function handleSubmit(f) {
  const p = me();
  const btn = f.querySelector('button:not([type=button])'); if (btn?.disabled) return;
  const lock = async fn => { if (btn) btn.disabled = true; try { return await fn(); } finally { if (btn && document.body.contains(btn)) btn.disabled = false; } };

  if (f.id === 'login-form') return lock(async () => {
    const { error } = await sb.auth.signInWithPassword({ email: val('au-email'), password: document.getElementById('au-pass').value });
    if (error) showErr('au-err', errMsg(error));
  });
  if (f.id === 'signup-form') return lock(async () => {
    const name = val('su-name'), phone = val('su-phone'), group = val('su-group'), email = val('au-email'), password = document.getElementById('au-pass').value;
    if (!name) return showErr('au-err', 'Enter your full name.');
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name, phone, group_id: group }, emailRedirectTo: location.origin + location.pathname } });
    if (error) return showErr('au-err', errMsg(error));
    if (!data.session) { authMode = 'signin'; authNotice = `We sent a confirmation link to ${email}. Open it on this phone, then sign in.`; clearDrafts(); render(); }
  });
  if (f.id === 'newpass-form') return lock(async () => {
    const password = document.getElementById('np-pass').value;
    const { error } = await sb.auth.updateUser({ password });
    if (error) return showErr('np-err', errMsg(error));
    recovery = false; toast('Password changed'); render();
  });
  if (f.id === 'profile-setup') return lock(async () => {
    const name = val('ps-name'); if (!name) return showErr('ps-err', 'Enter your full name.');
    const { error } = await sb.from('profiles').insert({ id: uid(), name, email: S.user.email, phone: val('ps-phone'), group_id: orNull(val('ps-group')) });
    if (error) return showErr('ps-err', errMsg(error));
    sessionUid = null; onSession({ user: S.user });
  });
  if (f.id === 'report-form') return lock(async () => {
    const att = val('r-att'), off = val('r-off'), bus = val('r-bus');
    if (att === '' || off === '' || bus === '') return showErr('r-err', 'Fill in attendance, offering and busing before submitting.');
    const souls = Math.min(500, Math.max(0, +val('r-souls') || 0));
    if (await run(sb.rpc('submit_report', { g: p.group, wk: THIS_WEEK, p_att: +att, p_off: +off, p_bus: +bus, p_souls: souls, p_notes: val('r-notes') }), 'Report submitted to the pastor', 'reports', 'settings')) go('mission');
  });
  if (f.id === 'add-form') return lock(async () => {
    const name = val('am-name'); if (!name) return showErr('am-err', 'Enter the member’s name.');
    const g = p.role === 'pastor' ? val('am-group') : p.group; if (!g) return showErr('am-err', 'Add a bacenta first.');
    const bday = val('am-bday');
    if (await run(sb.from('members').insert({ name, phone: val('am-phone'), group_id: g, status: 'New', bday: bday ? bday.slice(5) : '', joined: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) }), 'Member added', 'members')) { sheet = null; tab = 'people'; render(); }
  });
  if (f.id === 'fu-form') return lock(async () => {
    const note = val('fu-note'); if (!note) return toast('Write a short note first');
    const m = S.members.find(x => x.id === sheet.id);
    await run(sb.from('followups').insert({ member_id: m.id, group_id: m.group, type: val('fu-type'), note, by: uid(), by_name: p.name }), 'Follow-up logged', 'followups');
  });
  if (f.id === 'ann-form') return lock(async () => {
    if (!val('an-title') || !val('an-body')) return showErr('an-err', 'Add a title and a message.');
    if (await run(sb.from('announcements').insert({ title: val('an-title'), body: val('an-body'), audience: val('an-aud'), pinned: !!document.getElementById('an-pin')?.checked, by: uid(), by_name: p.name }), 'Announcement posted', 'announcements')) { sheet = null; tab = 'announcements'; render(); }
  });
  if (f.id === 'pr-form') return lock(async () => {
    if (!val('pr-body')) return showErr('pr-err', 'Write your prayer request first.');
    if (await run(sb.from('prayers').insert({ by: uid(), name: p.name, group_key: p.role === 'pastor' ? 'church' : (p.group || ''), body: val('pr-body') }), 'Prayer request shared', 'prayers')) { sheet = null; tab = 'prayer'; render(); }
  });
  if (f.id === 'gift-form') return lock(async () => {
    const a = +val('gf-amt'); if (!(a > 0)) return showErr('gf-err', 'Enter an amount above zero.');
    if (await run(sb.from('giving').insert({ uid: uid(), type: val('gf-type'), amount: a, date: val('gf-date') || todayKey() }), 'Gift saved to your record', 'giving')) { sheet = null; render(); }
  });
  if (f.id === 'event-form') return lock(async () => {
    if (!val('ev-title') || !val('ev-date')) return showErr('ev-err', 'Add a title and a date.');
    if (await run(sb.from('events').insert({ title: val('ev-title'), date: val('ev-date'), time: val('ev-time'), place: val('ev-place') }), 'Event added', 'events')) { sheet = null; render(); }
  });
  if (f.id === 'sermon-form') return lock(async () => {
    if (!val('sm-title') || !val('sm-date')) return showErr('sm-err', 'Add a title and a date.');
    const points = val('sm-points').split('\n').map(s => s.trim()).filter(Boolean);
    if (await run(sb.from('sermons').insert({ title: val('sm-title'), date: val('sm-date'), scripture: val('sm-scripture'), preacher: val('sm-preacher'), points }), 'Sermon added', 'sermons')) { sheet = null; render(); }
  });
  if (f.id === 'post-form') return lock(async () => {
    const body = val('po-body'); if (!body) return showErr('po-err', 'Write something before posting.');
    if (await run(sb.rpc('create_post', { p_topic: val('po-topic'), p_body: body }), 'Posted anonymously', 'board')) { sheet = null; boardFilter = 'All'; tab = 'board'; render(); window.scrollTo(0, 0); }
  });
  if (f.id === 'reply-form') return lock(async () => {
    const body = val('rp-body'); if (!body) return showErr('rp-err', 'Write your message first.');
    const anon = document.getElementById('rp-anon').checked; const pr = !!sheet.private;
    if (await run(sb.from('board_replies').insert({ post_id: sheet.id, body, anon, name: anon ? null : p.name, private: pr }), pr ? 'Sent privately to the poster' : 'Reply posted', 'board')) { sheet = null; render(); }
  });
  if (f.id === 'flag-form') return lock(async () => {
    if (await run(sb.from('flags').insert({ post_id: sheet.id, reason: val('fl-reason') }), 'Thank you. The pastor will review it.', 'flags')) { sheet = null; render(); }
  });
  if (f.id === 'task-form') return lock(async () => {
    const title = val('task-new'); if (!title) return;
    await run(sb.from('profiles').update({ custom_tasks: [...p.customTasks, { id: 'c' + Date.now(), title }] }).eq('id', uid()), 'Task added to every day', 'profile');
  });
  if (f.id === 'profile-form') return lock(async () => {
    const name = val('pf-name'); if (!name) return showErr('pf-err', 'Enter your name.');
    if (await run(sb.from('profiles').update({ name, phone: val('pf-phone') }).eq('id', uid()), 'Profile saved', 'profile')) { sheet = null; render(); }
  });
  if (f.id === 'settings-form') return lock(async () => {
    await run(sb.from('settings').update({ church_name: val('st-name') || CHURCH.name, momo: val('st-momo'), momo_name: val('st-momoname'), campaign_name: val('st-camp'), campaign_goal: +val('st-goal') || 0, campaign_reached: +val('st-reached') || 0 }).eq('id', 1), 'Church details saved', 'settings');
  });
  if (f.id === 'group-form') return lock(async () => {
    const name = val('gr-name'); if (!name) return toast('Enter a bacenta name');
    await run(sb.from('groups').insert({ name, zone: val('gr-zone') }), 'Bacenta added', 'groups');
  });
  if (f.classList.contains('role-form')) return lock(async () => {
    const id = f.dataset.user; const u = S.users.find(x => x.id === id);
    const role = id === uid() ? u.role : f.elements.role.value; const group = f.elements.group.value;
    await run(sb.rpc('set_role', { target: id, new_role: role, new_group: orNull(group) }), `${u.name} is now ${role === 'member' ? 'a member' : 'a ' + ROLE_LABEL[role]}`, 'users', 'groups', 'profile');
  });
}

document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet) { if (sheet.type === 'verse') markVerseSeen(); sheet = null; render(); } });
render();
