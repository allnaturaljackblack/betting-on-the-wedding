# Betting on the Wedding

A casino-themed wedding betting game for **Jack DeSpain & Emily Hill — May 16th, 2026**.

Guests place bets on fun wedding-night predictions. Two scoring modes: Traditional (points) or Vegas (chip wagering with American odds). Live leaderboard via Supabase Realtime.

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd betting-on-the-wedding
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, paste and run the contents of `supabase/schema.sql`.
3. This creates the `settings`, `questions`, `guests`, and `bets` tables and enables Realtime.

### 3. Set environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials from **Project Settings → API**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## Admin Panel

Navigate to `/admin` and log in with the default password.

**Default admin password: `wedding2026`**

Change it immediately in `/admin/settings` after first login.

From the admin panel you can:
- Add/edit/delete questions (5 types: Multiple Choice, Fill in the Blank, Over/Under, Moneyline, Prop Bet)
- Toggle between Traditional and Vegas scoring modes
- Lock/unlock betting
- Show/hide correct answers to guests
- View live guest and bet counts

---

## Deploying to Vercel

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **New Project**, then import your repo.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel auto-detects Vite — no build config needed.

Your app will be live at `https://your-project.vercel.app`.

> **Tip:** In Supabase → Authentication → URL Configuration, add your Vercel URL to the allowed origins list.

---

## Generating a QR Code for the Event

**Option 1 — Browser (no install):**
Go to [qr-code-generator.com](https://www.qr-code-generator.com) or [goqr.me](https://goqr.me), paste your deployed URL, and download as PNG or SVG to print.

**Option 2 — Command line (quick terminal preview):**
```bash
npx qrcode-terminal "https://your-project.vercel.app"
```

**Option 3 — Generate a PNG file:**
```bash
npm install -g qrcode
qrcode "https://your-project.vercel.app" -o wedding-qr.png
```

Print the QR code on table cards, programs, or display it on a screen at the venue so guests can scan and join.

---

## Tech Stack

- React 18 + Vite
- React Router v6
- Supabase (Postgres + Realtime)
- Pure CSS — no framework
- Google Fonts: Playfair Display

## Question Types

| Type | Description |
|------|-------------|
| Multiple Choice | Radio-style option cards with optional odds |
| Fill in the Blank | Open text input |
| Over / Under | Binary choice with a numeric line |
| Moneyline | Head-to-head matchup (e.g. who cries first) |
| Prop Bet | Yes / No toggle |
