# The Art of Shepherding

A church app people install on their phones. Everyone signs in with their own account and gets a home screen for their role:

- **Pastor:** the whole church. Dashboards, every bacenta's reports, roles and church settings.
- **Bacenta leader:** their own bacenta. Roster, Sunday attendance, weekly report, follow-ups.
- **Member:** verse of the day, daily devotion tasks, prayer wall, Ask & Share, sermon notes, events, giving record.

It runs on **Supabase** (database and sign-in) and **GitHub Pages** (the website people open). Both are free.

---

## Step 1: Set up the database (5 minutes, once)

1. In Supabase, open your project.
2. Click **SQL Editor** in the left menu, then **New query**.
3. Open the file `supabase/schema.sql` from this folder, copy **all** of it, and paste it into the editor.
4. Click **Run**. You should see "Success. No rows returned".

This creates every table and the security rules that control who can see what.

## Step 2: Sign-in settings (2 minutes)

In Supabase, open **Authentication**:

1. **Turn off email confirmation (recommended).** Go to **Sign In / Providers → Email** and switch off **Confirm email**, then save.
   Supabase's free email service only sends a few emails per hour. With confirmation on, many people signing up on the same Sunday would not receive their link.
2. **Allow your app's address.** Go to **URL Configuration**:
   - set **Site URL** to `https://gracechapelchurch.github.io/gracechapelchurch/`
   - add the same address under **Redirect URLs**

   This makes "Forgot your password?" emails open your app.

## Step 3: Connect the app to your project

`config.js` already holds this project's Supabase URL and publishable key. Change `CHURCH.name` there to set the church's name.

**Never put the secret key (`sb_secret_...`) in the app.**

## Step 4: The app online (GitHub Pages)

This repository is published with GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.
The app's address is **https://gracechapelchurch.github.io/gracechapelchurch/**.

Every change pushed to `main` goes live within a minute or two. To edit a file on GitHub, open it, click the pencil icon, and commit.

## Step 5: Become the pastor

**The first account created becomes the pastor automatically.** Everyone after that joins as a member.

1. Open your app address and tap **Create account**. Do this **before** you share the link with anyone.
2. You land on the pastor's screens (Home, Mission, People, Health, More).

## Step 6: Set up the church in the app

As the pastor, open **More → Church admin**:

1. **Church details:** church name, Mobile Money number for giving, and the outreach campaign (for example "Road to 10,000").
2. **Bacentas:** add each bacenta with its area.
3. Share the app link with your leaders. They **create accounts** and choose their bacenta.
4. In **People & roles**, set each leader's role to **Bacenta Leader**, pick their bacenta, and tap **Save**.
5. Members who choose a bacenta at sign-up are added to its roster automatically. Leaders can also add members who don't use the app (People → + Add member).

Then add sermons (Sermon notes → Add sermon) and events (Events → Add event), and share the link with the whole church.

## How people install it on their phone

Share the app link (WhatsApp works well).

- **Android (Chrome):** open the link, then tap **Install app** when it appears, or use menu ⋮ → **Add to Home screen**. There's also an **Install** button under More.
- **iPhone (Safari):** open the link, tap the **Share** button, then **Add to Home Screen**.

It gets its own icon, opens full screen, and updates live when leaders and the pastor make changes.

## Who can see what

These rules are enforced by the database itself (Row Level Security in `schema.sql`), not just hidden in the app:

| Data | Who can see it |
|---|---|
| Member roster, phone numbers, follow-ups | The pastor, and the leader of that bacenta |
| Attendance and weekly reports | The pastor, and the leader of that bacenta |
| Announcements | Whoever they were posted to (everyone, leaders, or one bacenta) |
| Prayer requests | The person's bacenta and the pastor |
| Ask & Share posts | Every signed-in member, **with no author stored on the post** |
| Who wrote an Ask & Share post | Only the author |
| Private messages to an anonymous poster | Only the author of that post |
| Devotion history, journal, sermon notes, giving record | Only the person themselves |
| Roles and bacenta assignments | Only the pastor can change them |

## Everyday jobs

- **Someone forgot their password:** they type their email on the sign-in screen and tap "Forgot your password?". They need Step 2.2 done.
- **A leader changes bacenta:** Church admin → People & roles.
- **Remove a harmful Ask & Share post:** the pastor taps **Remove** on the post, or reviews reported posts in Church admin.
- **Someone wants to leave:** they can delete their own account under More.
- **Free plan pause:** Supabase pauses a free project after 7 days with nobody using it. A church using it weekly won't hit this. If it happens, open the project in Supabase and click **Restore**. No data is lost.

## Next steps (optional)

- **Google Play Store:** wrap this app with Capacitor (<https://capacitorjs.com>) and publish ($25 one-time Google Play fee).
- **Apple App Store:** same Capacitor project ($99/year Apple Developer fee).
- **Push notifications** (daily verse, report reminders): can be added with a push service later.

## Files

```
index.html               app page
app.js                   all screens and logic
styles.css               design (navy and teal, Inter and Lora fonts)
config.js                Supabase project URL, publishable key, church name  ← edit this
manifest.webmanifest     install settings (name, icon, colours)
sw.js                    offline support
icons/                   app icons
supabase/schema.sql      database tables and security rules (run once in SQL Editor)
```
