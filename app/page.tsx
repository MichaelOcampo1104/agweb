import Link from "next/link";
import { getDirectoryStats, getTopCountries } from "@/lib/queries";
import { createClient } from "@/lib/server";

export default async function HomePage() {
  const [stats, topCountries, infraCount] = await Promise.all([
    getDirectoryStats(),
    getTopCountries(),
    getInfraCount(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-20 text-center">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            B2B Data Aggregation Platform
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Source certified suppliers &amp; track infrastructure pipelines
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            One platform for halal-certified manufacturers across{" "}
            {stats.country_count || "many"} countries and Singapore infrastructure
            project tracking — built for B2B buyers, contractors, and sourcing
            teams.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl gap-2">
            <form action="/manufacturers" className="flex flex-1 gap-2">
              <input
                name="q"
                type="search"
                placeholder="e.g. halal cosmetics in Turkey"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700"
              >
                Search
              </button>
            </form>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-slate-500">
            <Link href="/manufacturers" className="font-medium text-brand-700 hover:underline">
              Browse manufacturers →
            </Link>
            <span>or</span>
            <Link href="/infrastructure" className="font-medium text-blue-700 hover:underline">
              View infrastructure pipeline →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page -mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Manufacturers", value: stats.manufacturer_count },
          { label: "Countries", value: stats.country_count },
          { label: "Certifiers", value: stats.certifier_count },
          { label: "Infra Projects", value: infraCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm"
          >
            <div className="text-3xl font-bold text-brand-700">
              {s.value.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Verticals */}
      <section className="container-page mt-20">
        <h2 className="text-2xl font-bold text-slate-900">Explore</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Link
            href="/manufacturers"
            className="group rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
              🕌 Halal-Certified Manufacturers
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {stats.manufacturer_count.toLocaleString()} manufacturers across{" "}
              {stats.country_count || "many"} countries. Filter by industry, certifier,
              and certification status.
            </p>
          </Link>
          <Link
            href="/infrastructure"
            className="group rounded-xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
              🏗️ Singapore Infrastructure Pipeline
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {infraCount.toLocaleString()} government infrastructure projects tracked.
              Filter by agency, project type, and construction status.
            </p>
          </Link>
        </div>
      </section>

      {/* Top countries */}
      {topCountries.length > 0 && (
        <section className="container-page mt-20">
          <h2 className="text-2xl font-bold text-slate-900">Browse by country</h2>
          <p className="mt-1 text-slate-600">
            Countries with the most listed manufacturers.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topCountries.map(({ country, count }) => (
              <Link
                key={country}
                href={`/manufacturers?country=${encodeURIComponent(country)}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-brand-300 hover:shadow-sm"
              >
                <span className="font-medium text-slate-800">{country}</span>
                <span className="text-sm text-slate-400">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Value props */}
      <section className="container-page mt-20">
        <h2 className="text-2xl font-bold text-slate-900">Why sourcing teams use Sourcify</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Multi-vertical coverage",
              body: "Halal certification, infrastructure projects, and more — one platform, one search experience.",
            },
            {
              title: "Stop hunting across 100 sites",
              body: "Halal certification and government project data are fragmented across dozens of sources. We unify them.",
            },
            {
              title: "Built for B2B buyers",
              body: "Filter by industry, country, agency, and status to build a qualified shortlist fast.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <h3 className="font-semibold text-slate-900">{v.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page mt-20">
        <div className="rounded-2xl bg-brand-700 p-8 text-center text-white sm:p-12">
          <h2 className="text-2xl font-bold">Are you a certified manufacturer?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">
            Get found by importers and distributors worldwide. Submit your company
            to the directory.
          </p>
          <Link
            href="/leads/new"
            className="mt-6 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-brand-700 hover:bg-brand-50"
          >
            List your company
          </Link>
        </div>
      </section>
    </>
  );
}

/** Quick infra project count for the homepage stats. */
async function getInfraCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("infrastructure_projects")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}
