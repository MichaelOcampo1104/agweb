# Worklog & Resume Notes

> Source of truth for project status. Read this first when resuming.

**Last updated:** 2026-06-27
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
4. **Supabase project connected** — `yksuckngzyklqlhqjxru` with `db/schema.sql` applied
5. **Schema fix applied** — generated columns (`certification_bodies.slug`, `manufacturers.search_vector`) converted to trigger-based because `unaccent()` is STABLE not IMMUTABLE in PostgreSQL
6. **`.env` created** — all 5 vars set (Supabase URL, anon key, service role key, site URL)
7. **Local run verified** — `npm run dev` → all pages respond HTTP 200 (homepage, /manufacturers, /certifiers)

## 🔜 Next steps

### Step 1 — Populate data (optional but recommended before deploy)
- [ ] `cd scrapers && python run_scrapers.py run --all` to seed certifier data
- [ ] Homepage stats will show real numbers instead of zeros

### Step 2 — Deploy to Vercel
- [ ] Import repo into Vercel (vercel.com → New Project → `MichaelOcampo1104/agweb`)
- [ ] Add env vars in Vercel project settings (copy from `.env`)
- [ ] Deploy → get live URL → update `NEXT_PUBLIC_SITE_URL` to match

---

## 🔁 How to resume (copy-paste this to the agent)

> "Resume the agweb project. Read WORKLOG.md. Help me deploy to Vercel."

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
