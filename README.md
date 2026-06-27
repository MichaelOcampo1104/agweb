# Halal Directory 🕌

**The global directory of halal-certified manufacturers and certification bodies.**

[![Made with Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)
[![Status](https://img.shields.io/badge/status-active%20development-orange)](#roadmap)

---

Data is collected from scattered public certifier sources, organized into one
searchable place, and monetized via **paid featured listings** and **B2B lead
generation**. Built for importers, distributors, and sourcing teams who today
have to check dozens of separate certifier websites.

> **Why this niche:** Halal certification is fragmented across many bodies
> worldwide (unlike Kosher, dominated by OU). No dominant global aggregator
> exists — pure B2B buyers with real budgets, searching for data that is
> genuinely hard to find and frequently needed.

---

## ✨ Features

- **🔍 Full-text search** — Postgres `tsvector` search across manufacturer names, cities, industries, and products, backed by GIN indexes.
- **🌍 Global filtering** — by country, industry, and certification body, with paginated, server-rendered results (SEO-friendly).
- **🏢 Certifier directory** — the authorities that grant halal certification worldwide, seeded from JAKIM's authoritative list (~85 bodies / 47 countries).
- **📄 Structured data** — JSON-LD `Organization` markup on detail pages for rich search results.
- **🤖 Automated data pipeline** — Python scrapers with a CLI runner, dry-run mode, and idempotent upserts.
- **💰 Monetization built in** — featured-listing fields and a public lead-gen form, wired from day one (no later migration).
- **🔐 Secure by default** — Supabase Row Level Security: public read, service-role-only writes, anon-key lead submission only.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS |
| **Database** | Supabase (Postgres) — RLS, generated `tsvector`, GIN indexes |
| **Data pipeline** | Python — `httpx` · `pdfplumber` · `beautifulsoup4` · `supabase` · `typer` |
| **Deployment** | Vercel (web) + Supabase (DB) |

---

## 📁 Project Structure

```
agweb/
├── app/                        # Next.js App Router (server components by default)
│   ├── page.tsx                  Homepage — search hero, live stats, top countries
│   ├── manufacturers/
│   │   ├── page.tsx              Filterable, paginated directory
│   │   └── [slug]/page.tsx       Detail page + JSON-LD structured data
│   ├── certifiers/page.tsx       Global certification-body directory
│   ├── leads/new/page.tsx        Lead-gen form (monetization surface)
│   ├── api/                      JSON endpoints: manufacturers search + lead submission
│   └── sitemap.ts / robots.ts    Dynamic SEO
├── components/                 # Header, Footer, cards, filters, pagination, LeadForm
├── lib/                        # Supabase clients, DB types, query layer (queries.ts)
├── db/schema.sql               # ★ Schema — paste into Supabase SQL editor
└── scrapers/                   # Independent Python project (own venv + deps)
    ├── base.py                   Shared BaseScraper: fetch / download / upsert / log-run
    ├── jakim_foreign_cb.py       LIVE — JAKIM recognized certifier PDF
    ├── halal_foundation_bodies.py LIVE — Halal Foundation certifier list
    ├── manufacturer_template.py  Scaffold for new manufacturer sources
    └── run_scrapers.py           CLI runner
```

> 💡 **Extending the project?** Read [`AGENTS.md`](./AGENTS.md) — it documents the architecture, conventions, and the step-by-step recipe for adding new data sources.

---

## 🚀 Quick Start

### 1. Database (5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → New query → paste the contents of [`db/schema.sql`](./db/schema.sql) → Run.
3. In **Project Settings → API**, copy: the **Project URL**, the **anon public** key, and the **service_role** key.

### 2. Configure environment

Copy `.env.example` → `.env` at the repo root and fill in your values:

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # scrapers only — keep secret!
```

### 3. Run the scrapers

```bash
cd scrapers
python -m venv .venv
.venv\Scripts\activate          # Windows  |  source .venv/bin/activate  (macOS/Linux)
pip install -r requirements.txt

# Dry run first (fetch only — nothing written to the DB):
python run_scrapers.py run jakim-cb --dry-run

# Then populate the certifier directory:
python run_scrapers.py run --all
```

Expected: **~85 certification bodies across 47 countries** from JAKIM, enriched by the Halal Foundation list.

### 4. Run the website

```bash
npm install
npm run dev      # http://localhost:3000
```

The homepage, certifier directory, and lead form work immediately. The manufacturers directory fills in as you add manufacturer scrapers (see below).

---

## ➕ Adding Manufacturer Data Sources

The certifier directory ships with 2 live scrapers. The core product is the `manufacturers` table. Each new source is a small, pattern-following task:

1. Find a source listing certified manufacturers (a single certifier's public "certified companies" list is a great start).
2. Copy `scrapers/manufacturer_template.py` → `scrapers/manufacturers_<source>.py`.
3. Implement `fetch()` returning dicts shaped like the example in the docstring.
4. Register the class in the `SCRAPERS` map in `run_scrapers.py`.
5. Run: `python run_scrapers.py run manufacturers_<source>`

Upserts are idempotent on `(name, country)` — re-runs update, never duplicate.

---

## 💰 Monetization

Built into the schema from day one:

| Method | How |
|---|---|
| **Paid listings** | `manufacturers.featured` + `featured_until` — featured rows float to the top and get a badge. |
| **Lead generation** | `/leads/new` form + `leads` table — buyers request sourcing matches; sell the qualified leads to certified suppliers. |
| _Later_ | Google AdSense, premium data access, sponsored sections |

---

## 🔐 Security Model

| Key | Used by | Capabilities |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web app (browser-exposed) | READ manufacturers/bodies · INSERT leads only |
| `SUPABASE_SERVICE_ROLE_KEY` | Scrapers only (never browser) | Full access |

Enforced by **Row Level Security** in `db/schema.sql`. The anon key is safe to expose *because* RLS blocks all writes except lead submissions. **Never** commit the service key — `.env` is gitignored.

---

## 🗺 Roadmap

- [x] Database schema with full-text search + RLS + monetization fields
- [x] Live JAKIM & Halal Foundation certifier scrapers (96 bodies / 47+ countries)
- [x] Manufacturer scraper template (fully wired)
- [x] Directory UI: homepage, manufacturers, detail pages, certifiers, lead form
- [x] JSON search API + dynamic sitemap/robots
- [x] First manufacturer data source (Asia Halal Directory — 500 companies)
- [x] Production deployment (Vercel + Supabase) — [agweb-gold.vercel.app](https://agweb-gold.vercel.app)
- [ ] More manufacturer sources (US, EU, Middle East — see AGENTS.md §6)
- [ ] New verticals (organic, fair trade, ISO, etc. — see AGENTS.md §1)
- [ ] Featured-listing admin + checkout flow
- [ ] Lead-matching pipeline (auto-match buyers to certified suppliers)
- [ ] Scheduled scraper runs (cron / GitHub Actions)

---

## 📜 Sources

- [JAKIM e-Halal](https://myehalal.halal.gov.my) — Malaysia's recognized foreign certification bodies (authoritative global list).
- [Halal Foundation](https://halalfoundation.org/major-halal-certification-companies/) — curated list of major certifiers.

---

## License

This project is released under the **MIT License**. You're free to use, modify, and distribute it. The *aggregated data* remains the property of its respective public sources; this codebase simply organizes it.
