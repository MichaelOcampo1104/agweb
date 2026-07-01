"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  countries: string[];
  industries: string[];
  certBodies: string[];
}

/**
 * Client-side filter bar for the directory. On submit (or select change),
 * pushes a new URL with query params so the page re-renders server-side with
 * the filtered results — keeping everything SEO-friendly and shareable.
 */
export function DirectoryFilters({ countries, industries, certBodies }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset to page 1 on any filter change
    router.push(`/manufacturers?${next.toString()}`);
  }

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        update("q", String(fd.get("q") ?? ""));
      }}
    >
      <div className="lg:col-span-2">
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search manufacturers, products, cities…"
          className={`${selectClass} w-full`}
          onBlur={(e) => update("q", e.target.value)}
        />
      </div>
      <select
        className={selectClass}
        defaultValue={params.get("country") ?? ""}
        onChange={(e) => update("country", e.target.value)}
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        className={selectClass}
        defaultValue={params.get("industry") ?? ""}
        onChange={(e) => update("industry", e.target.value)}
      >
        <option value="">All industries</option>
        {industries.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <select
        className={selectClass}
        defaultValue={params.get("cert_body") ?? ""}
        onChange={(e) => update("cert_body", e.target.value)}
      >
        <option value="">All certifiers</option>
        {certBodies.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Active Filter Chips */}
      {(() => {
        const activeFilters = [
          { key: "q", label: params.get("q") ? `Search: "${params.get("q")}"` : null },
          { key: "country", label: params.get("country") },
          { key: "industry", label: params.get("industry") },
          { key: "cert_body", label: params.get("cert_body") },
        ].filter((f) => f.label);

        if (activeFilters.length === 0) return null;

        return (
          <div className="lg:col-span-5 mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Active filters:</span>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => update(f.key, "")}
                className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition"
              >
                {f.label}
                <span className="text-brand-400 font-bold hover:text-brand-600">×</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                router.push("/manufacturers");
              }}
              className="text-xs font-semibold text-slate-500 hover:text-brand-700 transition ml-1"
            >
              Clear all
            </button>
          </div>
        );
      })()}
    </form>
  );
}
