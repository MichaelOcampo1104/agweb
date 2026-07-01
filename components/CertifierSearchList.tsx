"use client";

import { useState } from "react";
import Link from "next/link";
import type { CertBody } from "@/lib/queries";

export function CertifierSearchList({ bodies }: { bodies: CertBody[] }) {
  const [query, setQuery] = useState("");

  const filtered = bodies.filter((b) => {
    const q = query.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.country && b.country.toLowerCase().includes(q)) ||
      (b.region && b.region.toLowerCase().includes(q))
    );
  });

  // group by country for browseability
  const byCountry = new Map<string, CertBody[]>();
  for (const b of filtered) {
    const key = b.country ?? "Unknown";
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(b);
  }
  const countries = [...byCountry.keys()].sort();

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="max-w-md">
        <input
          type="search"
          placeholder="Search by certifier name, country, or region..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {query && (
          <p className="mt-2 text-xs text-slate-500">
            Found {filtered.length} matching certifiers.
          </p>
        )}
      </div>

      {countries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No certifiers match your search term.
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
                      <div className="font-semibold text-slate-900 group-hover:text-brand-700">
                        {b.name}
                      </div>
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
    </div>
  );
}
