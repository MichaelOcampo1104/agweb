import Link from "next/link";
import { getDirectoryStats, getTopCountries } from "@/lib/queries";

export default async function HomePage() {
  const [stats, topCountries] = await Promise.all([
    getDirectoryStats(),
    getTopCountries(),
  ]);

  return (
    <>
      {/* Hero / search */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-20 text-center">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Global halal sourcing directory
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find halal-certified manufacturers, worldwide
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            One place to search certified producers across {stats.country_count || "many"}{" "}
            countries — with their certification body, status, and expiry in one view.
          </p>
          <form
            action="/manufacturers"
            className="mx-auto mt-8 flex max-w-xl gap-2"
          >
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
          <div className="mt-3 text-sm text-slate-500">
            or{" "}
            <Link href="/manufacturers" className="font-medium text-brand-700 hover:underline">
              browse all manufacturers →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page -mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Manufacturers", value: stats.manufacturer_count },
          { label: "Countries", value: stats.country_count },
          { label: "Certifiers listed", value: stats.certifier_count },
          { label: "Active certifiers", value: stats.active_certifier_count },
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

      {/* Top countries */}
      {topCountries.length > 0 && (
        <section className="container-page mt-20">
          <h2 className="text-2xl font-bold text-slate-900">Browse by country</h2>
          <p className="mt-1 text-slate-600">Countries with the most listed manufacturers.</p>
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
        <h2 className="text-2xl font-bold text-slate-900">Why sourcing teams use it</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Verified certification status",
              body: "See the certifying body, certificate number, and expiry date — not just a logo.",
            },
            {
              title: "Stop hunting across 100 sites",
              body: "Halal certification is fragmented across dozens of bodies worldwide. We unify the search.",
            },
            {
              title: "Built for B2B buyers",
              body: "Filter by industry, country, and certifier to build a qualified shortlist fast.",
            },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-6">
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
