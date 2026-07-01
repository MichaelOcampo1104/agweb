import Link from "next/link";
import { getDirectoryStats, getTopCountries } from "@/lib/queries";
import { createClient } from "@/lib/server";
import { SITE_URL } from "@/lib/site-url";

export default async function HomePage() {
  const [stats, topCountries, infraCount] = await Promise.all([
    getDirectoryStats(),
    getTopCountries(),
    getInfraCount(),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="container-page py-20 text-center relative z-10">
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

          {/* Trust strip */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="text-brand-600">✓</span>
              Data from official certifier registries only
            </span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <span className="text-brand-600">✓</span>
              Sourcing teams across {stats.country_count || "dozens of"} countries
            </span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <span className="text-brand-600">✓</span>
              Updated continuously via live scrapers
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
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

      {/* ── How it Works ─────────────────────────────────────────── */}
      <section className="container-page mt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <p className="mt-2 text-slate-500">
            From search to shortlist in minutes — no agency required.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              ),
              title: "Search the global directory",
              body: `Browse ${stats.manufacturer_count.toLocaleString()}+ halal-certified manufacturers across ${stats.country_count || "many"} countries — all aggregated from official certifier registries.`,
            },
            {
              step: "02",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7">
                  <path d="M4 6h16M7 12h10M10 18h4" />
                </svg>
              ),
              title: "Filter to a qualified shortlist",
              body: "Narrow by country, industry, certification body, and status. Zero in on exactly the suppliers that match your requirements.",
            },
            {
              step: "03",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: "Submit a sourcing request",
              body: "Tell us what you need. We match you with verified, certified manufacturers and deliver a curated shortlist — fast.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="absolute -top-3.5 left-6 inline-block rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white tracking-widest">
                {item.step}
              </span>
              <div className="mt-3 text-brand-600">{item.icon}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Verticals ────────────────────────────────────────────── */}
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

      {/* ── Top countries ────────────────────────────────────────── */}
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

      {/* ── Value props + buyer use-case callouts ────────────────── */}
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

        {/* Buyer use-case callouts */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              quote:
                "Used Sourcify to shortlist 8 halal poultry producers in Brazil in under 5 minutes — something that used to take us two days of emailing certifier bodies.",
              who: "EU Food Importer",
              flag: "🇪🇺",
            },
            {
              quote:
                "The certifier directory alone saved our compliance team hours every quarter. We can now verify a supplier's status in seconds before a purchase order.",
              who: "Halal Cosmetics Distributor",
              flag: "🇦🇪",
            },
          ].map((t) => (
            <figure
              key={t.who}
              className="rounded-xl border border-slate-200 bg-slate-50 p-6"
            >
              <blockquote className="text-sm leading-relaxed text-slate-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="text-base">{t.flag}</span>
                {t.who}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────── */}
      <section className="container-page mt-20 border-t border-slate-200 pt-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center text-slate-900">Frequently Asked Questions</h2>
          <p className="mt-2 text-center text-slate-500">
            Common questions about our directories and halal certification data.
          </p>

          <div className="mt-8 space-y-4">
            {[
              {
                q: "What is Sourcify?",
                a: "Sourcify is a B2B data aggregation platform that unifies fragmented public certification records. We currently aggregate halal-certified manufacturers and Singapore construction/infrastructure project pipelines.",
              },
              {
                q: "How do you verify supplier halal status?",
                a: "We only collect data from official certifier registries (such as JAKIM and MUIS). Each manufacturer profile lists its certifying body, certificate number, and validity date for full transparency.",
              },
              {
                q: "Can I list my certified manufacturing business?",
                a: "Yes. Click 'List your company' to submit a sourcing lead. If your business holds active, verifiable credentials from a recognized certifier, we will list it in the directory.",
              },
              {
                q: "Do you charge sourcing teams to use the platform?",
                a: "Browsing the directories is completely free for buyers. We monetize via paid featured placements for suppliers and premium sourcing reports for buyers looking for validated shortlists.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-slate-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900">
                  <h3 className="font-semibold text-sm sm:text-base">{faq.q}</h3>
                  <span className="shrink-0 rounded-full bg-slate-50 p-1.5 text-slate-500 group-open:rotate-180 transition">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
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
      
      {/* FAQPage Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is Sourcify?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sourcify is a B2B data aggregation platform that unifies fragmented public certification records. We currently aggregate halal-certified manufacturers and Singapore construction/infrastructure project pipelines."
                }
              },
              {
                "@type": "Question",
                "name": "How do you verify supplier halal status?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We only collect data from official certifier registries (such as JAKIM and MUIS). Each manufacturer profile lists its certifying body, certificate number, and validity date for full transparency."
                }
              },
              {
                "@type": "Question",
                "name": "Can I list my certified manufacturing business?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Click 'List your company' to submit a sourcing lead. If your business holds active, verifiable credentials from a recognized certifier, we will list it in the directory."
                }
              },
              {
                "@type": "Question",
                "name": "Do you charge sourcing teams to use the platform?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Browsing the directories is completely free for buyers. We monetize via paid featured placements for suppliers and premium sourcing reports for buyers looking for validated shortlists."
                }
              }
            ]
          })
        }}
      />

      {/* WebSite + SearchAction JSON-LD (enables Google Sitelinks Searchbox) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Sourcify",
            "url": SITE_URL,
            "description": "B2B data aggregation platform — halal-certified manufacturers, Singapore infrastructure projects, and more.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${SITE_URL}/manufacturers?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
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
