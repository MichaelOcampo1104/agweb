# Worklog & Resume Notes

> Source of truth for project status. Read this first when resuming.

**Last updated:** 2026-06-26
**Repo:** https://github.com/MichaelOcampo1104/agweb (public, main branch, in sync)
**Project:** Global Halal-Certified Manufacturers aggregator

---

## ✅ Completed

1. **Full app scaffold built & verified**
   - Next.js 16 + React 19 + TS + Tailwind frontend — `npm run build` passes clean (10 routes)
   - Supabase schema (`db/schema.sql`) — tables, full-text search, RLS, monetization fields
   - Python scrapers — base class + 2 LIVE sources + manufacturer template
     - JAKIM certifier PDF: tested live → **85 bodies / 47 countries**
     - Halal Foundation list: tested live → **12 bodies**
     - CLI runner (`run`, `list-scrapers`, `--dry-run`, `--all`) all verified
2. **Pushed to GitHub** — https://github.com/MichaelOcampo1104/agweb (public)
3. **Docs complete** — `README.md` (GitHub-ready, badges/roadmap), `AGENTS.md` (architecture + expansion guide), `LICENSE` (MIT)

## ⛔ Current blocker — the site is NOT live

Pushing code to GitHub does **not** deploy a website. The app currently:
- Has **no `.env` file** (cannot connect to any database)
- Has **no Supabase project** (no data source exists)
- Is **not running** anywhere — not locally, not on the internet

So: there is nothing to visit yet. Both local run and live deploy share the same first step.

## 🔜 Next steps (in order) — this is where work resumes

The 3 prerequisites before the site can run at all:

### Step 1 — Create the Supabase project (blocks everything)
- [ ] Sign up at [supabase.com](https://supabase.com) (free; GitHub login works) → **New project**
- [ ] Open **SQL Editor → New query** → paste all of `db/schema.sql` → **Run**
- [ ] In **Project Settings → API**, collect these 3 values:
  - `Project URL`
  - `anon public` key
  - `service_role` key

### Step 2 — Create `.env` at repo root (from `.env.example`)
- [ ] Fill in the 3 values from Step 1
- [ ] Set `NEXT_PUBLIC_SITE_URL` (localhost for local run, real domain for deploy)

### Step 3 — Run the site (choose ONE)

**Path A — Local only (you can see it on http://localhost:3000):**
- [ ] `npm run dev`
- [ ] Optionally populate certifier data: `cd scrapers && python run_scrapers.py run --all`

**Path B — Live on the internet (anyone can visit):**
- [ ] Import the GitHub repo into **Vercel** (vercel.com → New Project → pick `agweb`)
- [ ] Add the same env vars in Vercel's project settings
- [ ] Vercel returns a live `https://agweb-xxx.vercel.app` URL

---

## 🔁 How to resume (copy-paste this to the agent)

> "Resume the agweb project. Read WORKLOG.md. I've completed Supabase setup —
> here are my values: [paste Project URL, anon key, service key]. Create the
> `.env` and get the site running."

Or: "I created the Supabase project and applied db/schema.sql. Help me deploy to Vercel."

---

## 🔒 Security reminder (before any deploy)
- `.env` is gitignored — only `.env.example` (placeholders) is committed.
- `SUPABASE_SERVICE_ROLE_KEY` is the **secret** key — never commit it, never put
  it in any file the web app imports.
- Anon key is safe to expose (RLS blocks all writes except lead submissions).

## 🔧 Known gotchas (see AGENTS.md §12 for full list)
- **`typer` + `click`:** `requirements.txt` pins `click==8.1.8` — don't bump without bumping typer.
- **JAKIM PDF parsing is fragile** — if `jakim_foreign_cb.py` returns 0 rows, the PDF layout changed; update parser + pinned URL at top of file.
- **Next 16:** `cookies()` is async — `lib/server.ts`'s `createClient()` must be `await`ed.
- **Supabase partial `select()` loses types** — annotate `.forEach`/`.map` callbacks in `lib/queries.ts`.
