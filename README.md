# Trade Journal

Johnson Journal, on your own accounts — every tab works the same (Log Trade, Trade Log, Dashboard, Position Sizing with the Callisto planners and partials, loss protocol, Weekly Review, Milestones, the Rulebook), plus:

- **Accounts:** each broker account (AvaTrade, Kudo, ...) keeps its own deposit, deposits/withdrawals, balance, drawdown, loss protocol and lot sizes. Switch accounts at the top, or pick "All accounts" to see everything together. Every trade records its account.
- **AJ** as a source: its own risk %, 100-pip stop, 1 or 3 entries, and a fixed reward:risk plan (take profit at 1.5R, stop to breakeven at 1R) — the Log Trade form shows the BE and TP prices.
- **Psychology** tab: editable chapters, read once a week.
- Johnson Journal backups import directly — their trades land on the first account (AvaTrade).

It's four files plus a database schema — no build step:

| File | What it is |
|---|---|
| `index.html` | the page |
| `styles.css` | the look |
| `app.js` | everything the journal does |
| `config.js` | **your settings — the only file you edit** |
| `supabase/schema.sql` | creates the database tables, run once |

---

## Setup (about 20 minutes, all free)

You need three free accounts, all under your own name: **GitHub** (stores the code), **Supabase** (stores your trades) and **Render** (puts the site online).

### 1. Put the code on your GitHub

1. Sign in to github.com as **Phi11ip242**.
2. Top right **+** → **New repository**.
3. Name it `trade-journal`, choose **Private**, leave every "Add…" box unticked, click **Create repository**.
4. On the empty repo page click **uploading an existing file**.
5. Unzip `trade-journal.zip` and drag **everything inside the folder** (index.html, styles.css, app.js, config.js, README.md and the `supabase` folder) onto the page.
6. Click **Commit changes**.

### 2. Create the database on Supabase

1. Go to supabase.com → **Start your project** → sign in (GitHub sign-in is fine).
2. **New project**. Name: `trade-journal`. Set a database password (save it somewhere). Region: the closest one offered. Click **Create new project** and wait a minute or two.
3. Left menu → **SQL Editor** → **New query**.
4. Open `supabase/schema.sql`, copy all of it, paste it in, click **Run**. You should see "Success. No rows returned".
5. Left menu → **Authentication** → **Users** → **Add user** → **Create new user**. Enter your email and a password, tick **Auto Confirm User**, click **Create user**. This is the login for your journal.
6. Still in Authentication, open the sign-in settings (**Sign In / Providers**, or **Settings** on older dashboards) and turn **off** "Allow new users to sign up". Save. Now nobody else can create an account on your site.

### 3. Connect the journal to your database

1. In Supabase: **Project Settings** (gear icon) → **API Keys** (or **Data API** / **API** on older dashboards).
2. Copy the **Project URL** (looks like `https://abcdefghijkl.supabase.co`) and the **publishable key** (starts with `sb_publishable_`; older projects call it the **anon public** key).
   - Never use the **secret** / **service_role** key — that one is not safe to put on a website.
3. On GitHub, open your `trade-journal` repo → click `config.js` → the pencil icon (Edit).
4. Paste the URL and key between the quotes, and change `appName` to whatever you want the journal called:

   ```js
   window.JOURNAL_CONFIG = {
     supabaseUrl: "https://abcdefghijkl.supabase.co",
     supabaseKey: "sb_publishable_xxxxxxxxxxxxxxxx",
     appName: "Trade Journal"
   };
   ```

5. Click **Commit changes**.

### 4. Put it online with Render

1. Go to render.com → sign up / sign in **with GitHub**.
2. **New** → **Static Site**.
3. Connect your GitHub account if asked, and give Render access to the `trade-journal` repo.
4. Pick `trade-journal`, then fill in:
   - **Name:** `trade-journal` (this becomes part of the web address)
   - **Branch:** `main`
   - **Build Command:** leave empty (if it insists on one, type `echo done`)
   - **Publish Directory:** `.` (a single dot)
5. Click **Create Static Site**. After a minute you get an address like `https://trade-journal.onrender.com`.

### 5. Open it and sign in

1. Open the Render address and sign in with the email and password from step 2.5.
2. On your phone, open the same address and use **Add to Home Screen** so it works like an app.
3. Optional: in Supabase → Authentication → **URL Configuration**, set **Site URL** to your Render address (only used for password-reset emails).

---

## First things to set

1. **Position Sizing → Settings:** your accounts and their starting deposits, max drawdown, and your pairs (XAUUSD is there already: pip size 0.1, $10 per pip per lot). Risk % per source is under "Risk per setup".
2. **Position Sizing → Risk & plan:** Signal risk %, Own trade risk %, plan/max stop, take profit (R) and breakeven (R). 20% per idea is the hard cap.
3. **Rulebook → Edit:** write the strategy as you learn it. The starter chapters are your own rules (checklist, 1.5R management, risk, loss protocol, signals, news).
4. **Psychology:** read it once a week and tap **I've read it this week**.

## Changing things later

Any change pushed to the `main` branch on GitHub goes live on Render automatically within a minute or two.

## Backups

**Export JSON** (top right) downloads every trade and setting as one file. Keep one somewhere safe — for example at each weekly review. **Import JSON** loads such a file back and replaces what's in the account (it asks first).

## Good to know

- Free Supabase projects pause after about a week with no activity. If the journal stops loading after a break, open the Supabase dashboard and click **Restore project**.
- Your data lives only in your Supabase project. Row Level Security means only your signed-in account can read or change it, even though the page itself is public.
