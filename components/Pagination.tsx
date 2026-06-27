import Link from "next/link";
import { toQuery } from "@/lib/utils";

interface Props {
  page: number;
  pageCount: number;
  baseQuery: Record<string, string | undefined>;
  basePath?: string;
}

export function Pagination({ page, pageCount, baseQuery, basePath = "/manufacturers" }: Props) {
  if (pageCount <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  const link = (p: number) => `${basePath}${toQuery({ ...baseQuery, page: p })}`;
  const btn =
    "rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 hover:text-brand-700";

  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={link(page - 1)} className={btn} aria-label="Previous page">
          ← Prev
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={link(p)}
          className={
            p === page
              ? "rounded-lg border border-brand-600 bg-brand-600 px-3 py-1.5 text-sm text-white"
              : btn
          }
        >
          {p}
        </Link>
      ))}
      {page < pageCount && (
        <Link href={link(page + 1)} className={btn} aria-label="Next page">
          Next →
        </Link>
      )}
    </nav>
  );
}
