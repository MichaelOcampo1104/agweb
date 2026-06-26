import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            H
          </span>
          <span className="hidden sm:inline">Halal Directory</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/manufacturers" className="hover:text-brand-700">
            Manufacturers
          </Link>
          <Link href="/certifiers" className="hover:text-brand-700">
            Certifiers
          </Link>
          <Link
            href="/leads/new"
            className="rounded-lg bg-brand-600 px-3 py-2 text-white hover:bg-brand-700"
          >
            List your company
          </Link>
        </nav>
      </div>
    </header>
  );
}
