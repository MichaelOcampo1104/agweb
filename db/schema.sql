-- ============================================================================
-- Global Halal-Certified Manufacturers Directory — Database Schema
-- ============================================================================
-- Run this in the Supabase Dashboard → SQL Editor.
-- Designed for:
--   • Public read access (anonymous browsing drives SEO traffic)
--   • Service-role-only writes (your Python scrapers use the service key)
--   • Fast full-text search via generated tsvector + GIN indexes
--   • Built-in monetization fields (paid listings + lead capture) so you don't
--     need a migration later when you turn on revenue.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- for gen_random_uuid()
create extension if not exists "unaccent";       -- accent-insensitive search

-- ----------------------------------------------------------------------------
-- 1) Certification bodies  (global directory of halal certifiers)
--    This directory is itself a high-value SEO page and the lookup table that
--    manufacturers reference.
-- ----------------------------------------------------------------------------
create table if not exists public.certification_bodies (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    slug            text not null,
    country         text,
    region          text,
    website         text,
    email           text,
    phone           text,
    -- which authorities recognize this body, e.g. ['JAKIM','MUI','UAE']
    recognized_by   text[] not null default '{}',
    notes           text,
    source_url      text not null,
    raw_payload     jsonb,
    source          text not null default 'manual',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (name, country)
);

-- Trigger: auto-generate slug from name on insert/update
create or replace function public.generate_cb_slug()
returns trigger language plpgsql as $$
begin
    new.slug = lower(regexp_replace(unaccent(new.name), '[^a-z0-9]+', '-', 'g'));
    return new;
end;
$$;

drop trigger if exists trg_cb_slug on public.certification_bodies;
create trigger trg_cb_slug before insert or update of name on public.certification_bodies
    for each row execute function public.generate_cb_slug();

-- ----------------------------------------------------------------------------
-- 2) Manufacturers  (the core product of the directory)
-- ----------------------------------------------------------------------------
create table if not exists public.manufacturers (
    id                uuid primary key default gen_random_uuid(),
    name              text not null,
    slug              text not null,
    country           text not null,
    city              text,
    region            text,
    website           text,
    email             text,
    phone             text,
    -- flexible tagging arrays (multi-select filters on the directory page)
    industries        text[] not null default '{}',
    products          text[] not null default '{}',
    -- certification details
    cert_body         text,                 -- FK-ish: name of the certifier
    cert_body_id      uuid references public.certification_bodies(id) on delete set null,
    cert_number       text,
    cert_status       text not null default 'active',  -- active | expired | suspended | pending
    cert_valid_until  date,
    -- provenance + scraping metadata
    source            text not null,        -- scraper that produced this row
    source_url        text not null,
    raw_payload       jsonb,
    -- MONETIZATION: paid listings (Method: Paid Listings in the brief)
    -- featured listings float to the top of search and get a badge in the UI.
    featured          boolean not null default false,
    featured_until    timestamptz,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    unique (name, country)
);

-- Full-text search vector (populated by trigger — not a generated column
-- because unaccent() is STABLE, not IMMUTABLE).
alter table public.manufacturers
    add column if not exists search_vector tsvector;

create or replace function public.generate_mfr_search_vector()
returns trigger language plpgsql as $$
begin
    new.search_vector =
        setweight(to_tsvector('simple', unaccent(coalesce(new.name, ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(coalesce(new.city, ''))), 'B') ||
        setweight(to_tsvector('simple', unaccent(coalesce(new.country, ''))), 'B') ||
        setweight(to_tsvector('simple', unaccent(coalesce(array_to_string(new.industries, ' '), ''))), 'C') ||
        setweight(to_tsvector('simple', unaccent(coalesce(array_to_string(new.products, ' '), ''))), 'C');
    return new;
end;
$$;

drop trigger if exists trg_mfr_search_vector on public.manufacturers;
create trigger trg_mfr_search_vector before insert or update of name, city, country, industries, products on public.manufacturers
    for each row execute function public.generate_mfr_search_vector();

-- Indexes for the directory's filters, search, and ordering
create index if not exists manufacturers_search_idx    on public.manufacturers using gin (search_vector);
create index if not exists manufacturers_country_idx   on public.manufacturers (country);
create index if not exists manufacturers_status_idx    on public.manufacturers (cert_status);
create index if not exists manufacturers_body_idx      on public.manufacturers (cert_body);
create index if not exists manufacturers_industries_idx on public.manufacturers using gin (industries);
create index if not exists manufacturers_slug_idx      on public.manufacturers (slug);
create index if not exists manufacturers_featured_idx  on public.manufacturers (featured, featured_until desc);

-- ----------------------------------------------------------------------------
-- 3) Leads  (MONETIZATION: sell leads to suppliers / service providers)
--    A visitor searches for "halal cosmetic manufacturers in Turkey", can't
--    find exactly what they need, and submits a request. You sell these
--    qualified B2B leads to certified suppliers on the platform.
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
    id           uuid primary key default gen_random_uuid(),
    name         text not null,
    email        text not null,
    company      text,
    country      text,
    -- what they're looking for (used to match them to suppliers)
    message      text not null,
    industries   text[] not null default '{}',
    target_country text,
    status       text not null default 'new',  -- new | contacted | converted | lost
    created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4) Scrape runs  (operational log for the Python scrapers)
-- ----------------------------------------------------------------------------
create table if not exists public.scrape_runs (
    id              uuid primary key default gen_random_uuid(),
    source          text not null,
    status          text not null,           -- success | error | partial
    rows_fetched    integer not null default 0,
    rows_upserted   integer not null default 0,
    error_message   text,
    started_at      timestamptz not null default now(),
    finished_at     timestamptz
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_bodies_updated on public.certification_bodies;
create trigger trg_bodies_updated before update on public.certification_bodies
    for each row execute function public.touch_updated_at();

drop trigger if exists trg_manufacturers_updated on public.manufacturers;
create trigger trg_manufacturers_updated before update on public.manufacturers
    for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--   • Public can READ manufacturers + certification bodies + leads (submit).
--     Reads drive organic SEO traffic; this is the business model.
--   • Writes are service-role-only (scrapers). anon/authenticated cannot write
--     data, but anon CAN submit a lead (it's a public form).
-- ----------------------------------------------------------------------------
alter table public.certification_bodies enable row level security;
alter table public.manufacturers       enable row level security;
alter table public.leads               enable row level security;
alter table public.scrape_runs         enable row level security;

-- Public read policies (the 'anon' role covers unauthenticated visitors)
drop policy if exists "bodies_public_read"        on public.certification_bodies;
drop policy if exists "manufacturers_public_read" on public.manufacturers;
drop policy if exists "leads_public_insert"       on public.leads;
drop policy if exists "scrape_runs_no_public_read" on public.scrape_runs;

create policy "bodies_public_read"
    on public.certification_bodies for select
    to anon, authenticated using (true);

create policy "manufacturers_public_read"
    on public.manufacturers for select
    to anon, authenticated
    -- active certs are always public; featured flag is also public
    using (true);

create policy "leads_public_insert"
    on public.leads for insert
    to anon, authenticated with check (true);

-- NOTE: no SELECT policy on leads → only the service role can read leads.
-- NOTE: no policies on scrape_runs → service role only.

-- ----------------------------------------------------------------------------
-- Helpful view: live directory stats for the homepage ("X manufacturers
-- from Y countries, certified by Z bodies").
-- ----------------------------------------------------------------------------
create or replace view public.directory_stats as
select
    (select count(*)   from public.manufacturers)       as manufacturer_count,
    (select count(distinct country) from public.manufacturers where country is not null) as country_count,
    (select count(*)   from public.certification_bodies) as certifier_count,
    (select count(distinct cert_body) from public.manufacturers where cert_body is not null) as active_certifier_count;
