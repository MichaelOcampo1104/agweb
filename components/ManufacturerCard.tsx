import Link from "next/link";
import type { Manufacturer } from "@/lib/queries";
import { initial, statusBadge } from "@/lib/utils";

export function ManufacturerCard({ m }: { m: Manufacturer }) {
  const isFeatured = m.featured && (!m.featured_until || new Date(m.featured_until) > new Date());
  return (
    <Link
      href={`/manufacturers/${m.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
          {initial(m.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
            {m.name}
          </h3>
          <p className="truncate text-sm text-slate-500">
            {[m.city, m.country].filter(Boolean).join(", ") || m.country}
          </p>
        </div>
        {isFeatured && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
            Featured
          </span>
        )}
      </div>

      {m.industries?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.industries.slice(0, 3).map((ind) => (
            <span
              key={ind}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {ind}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="truncate text-slate-500">
          {m.cert_body || "Certifier pending"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${statusBadge(m.cert_status)}`}
        >
          {m.cert_status}
        </span>
      </div>
    </Link>
  );
}
