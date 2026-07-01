import type { Metadata } from "next";
import Link from "next/link";
import { getCertBodies } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Global Halal Certification Bodies Directory",
  description:
    "Browse halal certification bodies worldwide — recognized authorities that certify manufacturers, with their country and accreditation.",
  alternates: { canonical: "/certifiers" },
};

export default async function CertifiersPage() {
  const bodies = await getCertBodies();

  // group by country for browseability
  const byCountry = new Map<string, typeof bodies>();
  for (const b of bodies) {
    const key = b.country ?? "Unknown";
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(b);
  }
  const countries = [...byCountry.keys()].sort();

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Halal Certification Bodies
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          The authorities that grant halal certification worldwide. Each body
          audits and certifies manufacturers in its region. {bodies.length} bodies
          across {countries.length} countries.
        </p>
      </header>

      {countries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No certifier data yet. Run the scrapers to populate this directory
          (see the README).
        </div>
      ) : (
        <div className="space-y-10">
          {countries.map((country) => (
            <section key={country}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{country}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {byCountry.get(country)!.map((b) => (
                  <Link
                    key={b.id}
                    href={`/certifiers/${b.slug}`}
                    className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-brand-700">{b.name}</div>
                      {b.region && (
                        <div className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">
                          {b.region}
                        </div>
                      )}
                      {b.recognized_by?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {b.recognized_by.map((r) => (
                            <span
                              key={r}
                              className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                            >
                              Recognized by {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-xs font-medium text-brand-700">
                      View profile &amp; suppliers →
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Looking for manufacturers certified by a specific body?{" "}
        <Link href="/manufacturers" className="font-medium text-brand-700 hover:underline">
          Browse the manufacturer directory →
        </Link>
      </div>
    </div>
  );
}
