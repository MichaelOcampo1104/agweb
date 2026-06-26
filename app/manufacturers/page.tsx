import type { Metadata } from "next";
import { Suspense } from "react";
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
  searchParams: SearchParams;
}) {
  const filters: FilterValues = {
    q: param(searchParams.q),
    country: param(searchParams.country),
    cert_body: param(searchParams.cert_body),
    industry: param(searchParams.industry),
    status: param(searchParams.status),
    page: param(searchParams.page) ? Number(param(searchParams.page)) : 1,
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

  return (
    <div className="container-page py-10">
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
        <div className="mt-16 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No manufacturers found</h2>
          <p className="mt-2 text-slate-500">
            Try adjusting your filters, or{" "}
            <a href="/leads/new" className="text-brand-700 hover:underline">
              request a sourcing lead
            </a>{" "}
            and we&apos;ll match you with certified suppliers.
          </p>
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
