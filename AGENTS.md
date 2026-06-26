# AGENTS.md

Guidance for AI coding agents (and humans) working on this repository. Read this
before making changes. It documents the project's intent, architecture,
conventions, and the approved patterns for extending it.

---

## 1. What this project is

**Halal Directory** — a global aggregator of **halal-certified manufacturers**
and the **certification bodies** that certify them.

Business model (informs every product decision):
- **Traffic**: organic SEO. Users hate hunting across dozens of certifier sites.
- **Monetization**: (1) paid featured listings, (2) B2B lead generation,
  (3) later — ads, premium data access, sponsored sections.
- **Audience**: B2B buyers — importers, distributors, sourcing teams. Not
  consumers. Optimize for buyers with budgets, not browsers.

When making product calls: the data must be *genuinely hard to find elsewhere*,
*frequently needed*, and *kept fresh*. Stale or trivially-Googleable data has
negative value here.

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| Web | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind |
| DB | Supabase (Postgres) — RLS, generated `tsvector` full-text search |
| Data | Python scrapers — `httpx` · `pdfplumber` · `beautifulsoup4` · `supabase` |
| Deploy | Vercel (web) + Supabase (DB) |

---

## 3. Two subsystems, one seam

This repo has **two independent codebases** that communicate only through the
database. Understand the boundary:

```
[ Python scrapers ] --service-role key--> [ Supabase Postgres ] <--anon key-- [ Next.js web ]
```

- **`/scrapers`** — writes data. Uses the **service_role** key (full access).
  Never imported by the web app. Runs on a schedule or manually.
- **`/app`, `/components`, `/lib`** — reads data. Uses the **anon public** key
  (RLS-restricted). Never writes to data tables (only inserts `leads`).

**Never mix the two subsystems.** Don't import Python scraper code into the web
app, and don't run web queries with the service key.

---

## 4. Repository layout

```
app/                        Next.js App Router (all routes are server components by default)
├── page.tsx                  Homepage — search hero, live stats, top countries
├── manufacturers/
│   ├── page.tsx              Directory: filterable, paginated, server-rendered
│   └── [slug]/page.tsx       Detail page + JSON-LD structured data
├── certifiers/page.tsx       Global certification-body directory
├── leads/new/page.tsx        Lead-gen form (monetization surface)
├── api/
│   ├── manufacturers/route.ts  GET — JSON search endpoint
│   └── leads/route.ts          POST — public lead submission
├── sitemap.ts / robots.ts    Dynamic SEO files
└── layout.tsx / globals.css

components/                  Presentational + small client components
├── Header / Footer
├── ManufacturerCard / DirectoryFilters / Pagination
└── LeadForm                 "use client" — the only form

lib/                         Shared web-side logic
├── server.ts                  async createClient() — Supabase server client (Next 16: cookies() is a Promise)
├── env.ts                     browser Supabase client
├── queries.ts                 ★ ALL data access for pages lives here
├── utils.ts                   toQuery / statusBadge / initial
└── db/database.types.ts       hand-written DB types (regenerable via Supabase CLI)

db/schema.sql                ★ Source of truth for the schema — paste into Supabase SQL editor

scrapers/                    Independent Python project (own venv, own deps)
├── base.py                    BaseScraper: fetch/download/upsert/log-run
├── jakim_foreign_cb.py        LIVE — JAKIM certifier PDF
├── halal_foundation_bodies.py LIVE — Halal Foundation certifier list
├── manufacturer_template.py   scaffold for manufacturer sources
└── run_scrapers.py            CLI: `run`, `list-scrapers`, `--dry-run`, `--all`
```

★ = files you'll touch most often.

---

## 5. Running locally

**Web:**
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also runs typecheck)
```

**Scrapers** (separate venv):
```bash
cd scrapers
python -m venv .venv && .venv\Scripts\activate   # win  |  source .venv/bin/activate (unix)
pip install -r requirements.txt
python run_scrapers.py run jakim-cb --dry-run    # test without writing
python run_scrapers.py run --all                 # populate DB
```

Both need `.env` at repo root (copy `.env.example`). See README §Quick start.

---

## 6. ★ The primary expansion path: adding a manufacturer source

This is THE way the product grows. The certifier directory is seeded; the real
product is `manufacturers`. Follow this exactly:

1. **Find a source** that lists manufacturers + cert details. Best early
   sources: a single certifier's public "certified companies" list.
2. **Copy** `scrapers/manufacturer_template.py` → `scrapers/manufacturers_<source>.py`.
3. **Implement `fetch()`** returning a `list[dict]`. Every key must map 1:1 to a
   `manufacturers` column (see the docstring example). Required: `name`, `slug`,
   `country`, `source`, `source_url`. Set `cert_status="active"` unless you know
   otherwise.
4. **Generate `slug`** with the module's `slugify()` (matches the DB's generated
   format: lowercase, hyphenated, accents stripped).
5. **Register** the class in the `SCRAPERS` map in `run_scrapers.py`.
6. **Test:** `python run_scrapers.py run manufacturers_<source> --dry-run` first.
   Inspect the sample output. Only then run without `--dry-run`.
7. **Verify in the web app** — the directory auto-picks up new rows; no UI change
   needed unless you add a new filter dimension.

Upsert is idempotent on `(name, country)` — re-runs update, never duplicate.

### Scraper conventions
- Subclass `BaseScraper`. Set `name` and `target_table` ("manufacturers" or
  "certification_bodies").
- Use `self.get_text(url)` for HTML and `self.download(url, filename)` for
  binaries (PDFs) — both have retries + realistic headers baked in.
- **Parse defensively.** Skip anything ambiguous; never guess. A row with a
  wrong name is worse than a missing row. Keep the original data in `raw_payload`
  for traceability and later cleanup.
- If a source format is fragile, mark the run `error`/`partial` rather than
  writing bad data — `BaseScraper.run()` handles logging to `scrape_runs`.

---

## 7. Adding a frontend page

- **Default to Server Components / RSC.** Fetch data via `lib/queries.ts` — do
  not call `createClient()` directly in a page except inside `queries.ts`. This
  keeps all data access in one auditable place.
- **Add `"use client"` only when you need interactivity** (forms, filters, state).
  See `components/LeadForm.tsx` and `DirectoryFilters.tsx` for the pattern.
- **SEO is the traffic engine.** Every public page should set `metadata`
  (title/description/canonical). List/detail pages are server-rendered on
  purpose — don't convert them to client components for data fetching.
- **Add JSON-LD structured data** to detail pages (see `manufacturers/[slug]/page.tsx`).
- **Internal linking matters** for SEO — use the related-items pattern.

---

## 8. Database changes

Schema source of truth: **`db/schema.sql`**. To change the schema:

1. Edit `db/schema.sql` (make it idempotent — `create table if not exists`,
   `add column if not exists`, etc.) so re-running is safe.
2. Run the changed statements in Supabase **SQL Editor**.
3. Update `lib/db/database.types.ts` to match (hand-edited). For full fidelity,
  `supabase gen types typescript --linked > lib/db/database.types.ts` (needs
  `supabase link` first).
4. If you added a filterable column, extend `getManufacturers()` + the filter UI.

**Monetization fields are intentionally built in already** (`featured`,
`featured_until`, `leads`). Don't refactor them out — they're load-bearing for
the business model.

---

## 9. Security model (do not break this)

| Key | Used by | Can do |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web app (exposed to browser) | READ manufacturers/bodies; INSERT leads only |
| `SUPABASE_SERVICE_ROLE_KEY` | Scrapers only (never browser) | Full access |

Enforced by **Row Level Security** in `db/schema.sql`. Rules:
- The anon key is safe to expose *because* RLS blocks writes. If you add a
  table, add an RLS policy — an unpolicy'd table under RLS blocks all access.
- **Never** put the service key in any file the web app imports, nor in
  `NEXT_PUBLIC_*` env vars.
- `.env` is gitignored. Only `.env.example` (placeholders) is committed. If the
  repo goes public, double-check no secret ever entered git history.

---

## 10. Conventions & code style

- **TypeScript strict.** All `lib/queries.ts` `.forEach`/`.map` callbacks over
  Supabase partial selects need explicit param types (the SDK infers `any` for
  partial `select()`).
- **Next 16: `cookies()` returns a Promise.** `lib/server.ts`'s `createClient()`
  is `async` and must be `await`ed at every call site.
- Avoid name collisions between imported types and components (e.g. the
  `DirectoryFilters` type vs component — alias on import).
- Tailwind: brand color is `brand` (green) — see `tailwind.config.ts`.
- Container: `className="container-page"`.
- Match existing file's comment density and naming. No dead code, no TODOs
  without context.

---

## 11. Verification before considering work done

- `npm run build` passes (this also typechecks).
- New scraper: run `--dry-run`, confirm output shape, then a real run; check the
  row appears in the directory UI.
- If touching security/RLS: re-read §9 and confirm no key leakage.

---

## 12. Known gotchas

- **`typer` + `click`:** `requirements.txt` pins `click==8.1.8`. click ≥8.2 breaks
  `typer` 0.13 (`make_metavar`). Don't bump click without bumping typer.
- **PDF parsing is fragile.** JAKIM republishes the certifier PDF with a new
  layout/edition date periodically. If `jakim_foreign_cb.py` fetches 0 rows or
  errors, the PDF layout changed — update the parser and the pinned URL at the
  top of the file. The run is logged as `error`, never silently writing junk.
- **Supabase partial `select()` loses types** — annotate callbacks (§10).
- **`search_vector` is a generated column** — never INSERT/UPDATE it directly.

---

## 13. Decision log (deliberate choices)

- **Niche = halal manufacturers** (global, underserved, B2B buyers, fragmented
  certifiers = aggregator opportunity). Not generic.
- **Certifier directory ships live; manufacturers ship as a template.** The
  plumbing is done; each manufacturer source is a small follow-on. Don't build a
  "generic source connector" abstraction — concrete scrapers are clearer.
- **RLS = public read.** Traffic is the business; gatekeeping reads would kill
  SEO. Monetization is via featured placement + leads, not paywalls on data.
- **Hand-written DB types** instead of requiring the Supabase CLI to build
  locally. Regenerable when the CLI is available.
