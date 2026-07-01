# AGENTS.md

Guidance for AI coding agents (and humans) working on this repository. Read this
before making changes. It documents the project's intent, architecture,
conventions, and the approved patterns for extending it.

---

## 1. What this project is

**B2B Data Aggregation Platform** — a multi-vertical directory platform that
aggregates hard-to-find, frequently-needed business data from fragmented public
sources. The current vertical is **halal-certified manufacturers**, but the
platform is designed to expand into additional verticals (organic certification,
fair trade, ISO standards, supply-chain compliance, etc.).

**Current vertical (live): Halal Directory** — a global aggregator of
**halal-certified manufacturers** and the **certification bodies** that certify
them.

Business model (applies across verticals):
- **Traffic**: organic SEO. Users hate hunting across dozens of certifier sites.
- **Monetization**: (1) paid featured listings, (2) B2B lead generation,
  (3) later — ads, premium data access, sponsored sections.
- **Audience**: B2B buyers — importers, distributors, sourcing teams. Not
  consumers. Optimize for buyers with budgets, not browsers.

When making product calls: the data must be *genuinely hard to find elsewhere*,
*frequently needed*, and *kept fresh*. Stale or trivially-Googleable data has
negative value here.

### The expansion vision: a platform, not a single directory

The infrastructure — Next.js, Supabase, Python scrapers, RLS security — is
vertical-agnostic. Each new vertical follows the same pattern:

1. **Pick a niche** where certification/registration data is fragmented across
   bodies (organic, kosher, fair trade, ISO, FSC, etc.)
2. **Seed the certifier/authority directory** (the SEO backbone)
3. **Add manufacturer/supplier sources** (the core product)
4. **Monetize** via the same mechanisms (featured listings, lead gen)

Every new vertical adds a new set of pages, API endpoints, and scrapers that
share the same database, auth model, and deployment. This is the "project
pipeline" — a repeatable factory for B2B data directories.

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

## 6. ★ Expansion paths

There are two ways the product grows:

### Path A: Adding a manufacturer source (current vertical)

This is THE way the current halal vertical grows. Follow this exactly:

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

### Path B: Adding a new vertical (the project pipeline)

To launch a new directory vertical (e.g., "Organic Certification Directory",
"Fair Trade Suppliers", "ISO-Certified Manufacturers"):

1. **Schema** — add new tables to `db/schema.sql` (or reuse the pattern from
   `manufacturers` / `certification_bodies`). Run in Supabase SQL Editor.
2. **Update DB types** — `lib/db/database.types.ts` to match.
3. **Add routes** in `app/<vertical>/` following the existing pattern:
   directory page, `[slug]/` detail, API endpoint.
4. **Add SEO surface** — sitemap entries, metadata, structured data, internal
   linking from the homepage.
5. **Add scrapers** — one for certifiers/authorities, then manufacturer-level
   sources.
6. **Update homepage** to feature the new vertical (stats card, search entry
   point, or nav link).

Each vertical lives in its own URL namespace (`/<vertical>/`) and owns its own
tables, but shares the same infrastructure, auth model, and monetization
surfaces.

### Scraper conventions (both paths)
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

- **Platform, not a single directory.** The infrastructure is vertical-agnostic.
  Halal is the first vertical, not the only one. New verticals follow the same
  pattern without reinventing the DB/auth/scraper/deploy stack.
- **One Supabase project for all verticals.** Tables are namespaced by vertical
  (or use a `vertical` column). RLS + anon-key-read stays per-table. Don't spin
  up separate DBs per vertical — that kills cross-vertical SEO and complicates
  monetization.
- **Niche directories, not a generic aggregator.** Each vertical is underserved
  B2B data with fragmented certifiers = aggregator opportunity. Not generic
  "business directory."
- **Certifier directory ships live; manufacturers ship as scrapers.** The
  plumbing is done; each manufacturer source is a small follow-on. Don't build a
  "generic source connector" abstraction — concrete scrapers are clearer.
- **RLS = public read.** Traffic is the business; gatekeeping reads would kill
  SEO. Monetization is via featured placement + leads, not paywalls on data.
- **Hand-written DB types** instead of requiring the Supabase CLI to build
  locally. Regenerable when the CLI is available.

---

## 14. SEO & Search Console (in progress — 2026-06-28)

SEO is the traffic engine (§7), so the plumbing is centralized and hardened.
What's done vs. what's still pending:

### Done (shipped, live on `agweb-gold.vercel.app`)
- **`lib/site-url.ts`** — single source of truth for the canonical site URL.
  `SITE_URL` + `siteUrl(path)`. **Warns at production build time** if
  `NEXT_PUBLIC_SITE_URL` is unset or still `localhost` — that state produces a
  sitemap pointing at localhost and Google silently ignores every URL.
  All SEO consumers (`sitemap.ts`, `robots.ts`, `layout.tsx`) import from here;
  don't re-read the env var inline elsewhere.
- **`app/sitemap.ts`** — complete: static pages (incl. `/infrastructure`) +
  all manufacturer detail pages + all infrastructure detail pages. Queries
  run in parallel. **Only emit `[slug]` URLs for routes that actually exist**
  — `/certifiers/[slug]` is intentionally omitted because that route doesn't
  exist (would create 404s that hurt indexing).
- **`app/robots.ts`** — allows all crawlers, points to sitemap.
- **`public/google7cddd593802f59bb.html`** — Google Search Console HTML
  verification file. Verified live: HTTP 200, body matches exactly.
  (Files in `public/` are served at the site root.)

### FOLLOW-UP (requires owner's Google login — can't be automated)
- [ ] **Verify ownership** in [Search Console](https://search.google.com/search-console):
  property is `https://agweb-gold.vercel.app/` (HTTPS + trailing slash) →
  click **Verify**. Should turn green immediately.
- [ ] **Submit sitemap**: Sitemaps tab → enter `sitemap.xml` → Submit.
- [ ] **Monitor indexing**: Performance → Pages. First pages typically index
  in days; fuller coverage over weeks.
- [ ] **Custom domain** (recommended, not blocking): a `*.vercel.app`
  subdomain ranks weaker long-term. When a custom domain is added, update
  `NEXT_PUBLIC_SITE_URL` in Vercel env vars — the code handles the rest, and
  the Search Console property will need re-verifying under the new domain.

### Convention: adding a new vertical's pages to the sitemap
When a new vertical lands (§6 Path B), extend `app/sitemap.ts` with both its
listing page and its `[slug]` detail pages (parallel `Promise.all` query),
and add the listing to the `staticPages` array. Confirm the detail route
exists first — never emit a URL that 404s.
