import type { Metadata } from "next";
import Link from "next/link";
import { getManufacturers } from "@/lib/queries";
import { ManufacturerCard } from "@/components/ManufacturerCard";
import { Pagination } from "@/components/Pagination";

interface Props {
  params: Promise<{ country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const decoded = decodeURIComponent(country);
  return {
    title: `Halal-Certified Manufacturers in ${decoded}`,
    description: `Directory of halal-certified manufacturers, producers, and suppliers located in ${decoded}. Find verified business partners.`,
    alternates: { canonical: `/manufacturers/country/${country}` },
  };
}

export default async function CountryPage({ params, searchParams }: Props) {
  const { country } = await params;
  const sp = await searchParams;
  const decoded = decodeURIComponent(country);

  const filters = {
    country: decoded,
    industry: param(sp.industry),
    cert_body: param(sp.cert_body),
    status: param(sp.status),
    page: param(sp.page) ? Number(param(sp.page)) : 1,
  };

  const result = await getManufacturers(filters);

  const baseQuery: Record<string, string | undefined> = {
    industry: filters.industry,
    cert_body: filters.cert_body,
    status: filters.status,
  };

  return (
    <div className="container-page py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/manufacturers" className="hover:text-brand-700">Manufacturers</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-400">Country</span>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{decoded}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Halal-Certified Manufacturers in {decoded}
        </h1>
        <p className="mt-2 text-slate-600">
          {result.total.toLocaleString()} certified manufacturers based in {decoded}.
        </p>
      </header>

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

      <div className="mt-8">
        <Pagination page={result.page} pageCount={result.pageCount} baseQuery={baseQuery} />
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Looking for more advanced filters or other countries?{" "}
        <Link href="/manufacturers" className="font-medium text-brand-700 hover:underline">
          Go to the main directory →
        </Link>
      </div>
    </div>
  );
}
