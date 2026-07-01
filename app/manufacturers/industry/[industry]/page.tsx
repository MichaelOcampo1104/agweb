import type { Metadata } from "next";
import Link from "next/link";
import { getManufacturers } from "@/lib/queries";
import { ManufacturerCard } from "@/components/ManufacturerCard";
import { Pagination } from "@/components/Pagination";

interface Props {
  params: Promise<{ industry: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params;
  const decoded = decodeURIComponent(industry);
  return {
    title: `Halal-Certified ${decoded} Manufacturers & Suppliers`,
    description: `Directory of global halal-certified manufacturers, producers, and suppliers in the ${decoded} industry. Find verified business partners.`,
    alternates: { canonical: `/manufacturers/industry/${industry}` },
  };
}

export default async function IndustryPage({ params, searchParams }: Props) {
  const { industry } = await params;
  const sp = await searchParams;
  const decoded = decodeURIComponent(industry);

  const filters = {
    industry: decoded,
    country: param(sp.country),
    cert_body: param(sp.cert_body),
    status: param(sp.status),
    page: param(sp.page) ? Number(param(sp.page)) : 1,
  };

  const result = await getManufacturers(filters);

  const baseQuery: Record<string, string | undefined> = {
    country: filters.country,
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
        <span className="text-slate-400">Industry</span>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{decoded}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Halal-Certified {decoded} Manufacturers
        </h1>
        <p className="mt-2 text-slate-600">
          {result.total.toLocaleString()} certified suppliers specializing in {decoded}.
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
        Looking for more advanced filters or other industries?{" "}
        <Link href="/manufacturers" className="font-medium text-brand-700 hover:underline">
          Go to the main directory →
        </Link>
      </div>
    </div>
  );
}
