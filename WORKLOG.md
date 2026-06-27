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

8. **Deployed to Vercel** 🚀 — **https://agweb-gold.vercel.app** (production)
   - All routes return 200 (/, /manufacturers, /certifiers, /api/*)
   - 10 routes compiled, TypeScript clean, 6.2s build
   - 5 env vars set in Vercel project settings
   - GitHub auto-deploy connected (push to main → auto-deploy)
9. **Database seeded** — 96 certification bodies from 2 sources
   - JAKIM foreign CB list: 85 bodies across 47+ countries
   - Halal Foundation list: 12 bodies (1 deduped by unique constraint)
   - Fixed: upgraded supabase Python SDK 2.9.1→2.31.0 (new `sb_secret_` key format support)
10. **First manufacturer source live** — 500 Singapore companies via Asia Halal Directory
    - Scraper: `manufacturers_asia_halal.py` (10 pages, 50 entries each)
    - All MUIS-certified across 40+ industries (Frozen Foods, Eggs, Caterers, Cafes, etc.)
    - Homepage: **500 manufacturers, 96 certifiers, 1 country** (verified on live site)

## 🔜 Next steps

- [ ] **Add more manufacturer sources** — see AGENTS.md §6 for the template. Target certifier "client lists" (ISA, IFANCA, Halal Control, BPJPH, etc.)
- [ ] **Add country diversity** — current 500 manufacturers are all Singapore; next source should target a different region (US, EU, Middle East, ASEAN)
- [ ] (Later) **Custom domain** — in Vercel project settings → Domains
- [ ] (Later) **Paid listings** — manufacturers with `featured=true` get priority placement

---

## 🔁 How to resume (copy-paste this to the agent)

> "Resume the agweb project. Read WORKLOG.md. The site is live at agweb-gold.vercel.app. Let's seed some data and add our first manufacturer source."

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
