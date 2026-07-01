import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SITE_URL } from "@/lib/site-url";
import {
  getManufacturers,
  getFilterOptions,
  type DirectoryFilters as FilterValues,
} from "@/lib/queries";
import { ManufacturerCard } from "@/components/ManufacturerCard";
import { DirectoryFilters } from "@/components/DirectoryFilters";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Browse Halal-Certified Manufacturers",
  description:
    "Search and filter the global directory of halal-certified manufacturers by country, industry, and certification body.",
  alternates: { canonical: "/manufacturers" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function param(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ManufacturersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters: FilterValues = {
    q: param(sp.q),
    country: param(sp.country),
    cert_body: param(sp.cert_body),
    industry: param(sp.industry),
    status: param(sp.status),
    page: param(sp.page) ? Number(param(sp.page)) : 1,
  };

  const [result, options] = await Promise.all([
    getManufacturers(filters),
    getFilterOptions(),
  ]);

  const baseQuery: Record<string, string | undefined> = {
    q: filters.q,
    country: filters.country,
    cert_body: filters.cert_body,
    industry: filters.industry,
    status: filters.status,
  };

  const breadcrumbJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Manufacturers",
        "item": `${SITE_URL}/manufacturers`
      }
    ]
  });

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manufacturers</h1>
        <p className="mt-2 text-slate-600">
          {result.total.toLocaleString()} halal-certified manufacturers across the world.
        </p>
      </header>

      <Suspense fallback={<div className="h-12" />}>
        <DirectoryFilters
          countries={options.countries}
          industries={options.industries}
          certBodies={options.certBodies}
        />
      </Suspense>

      {result.manufacturers.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No manufacturers found</h2>
          <p className="mt-2 text-sm text-slate-500">
            We couldn&apos;t find any certified manufacturers matching your current filters. Try resetting them, or submit a sourcing request to have our team match you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/manufacturers"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              Reset all filters
            </Link>
            <Link
              href="/leads/new"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition"
            >
              Request sourcing lead
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.manufacturers.map((m) => (
            <ManufacturerCard key={m.id} m={m} />
          ))}
        </div>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} baseQuery={baseQuery} />
    </div>
  );
}
