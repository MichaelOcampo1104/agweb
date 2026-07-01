import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      {/* 404 Icon wrapper */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-lg text-slate-600">
        Sorry, we couldn&apos;t find the page you are looking for. It might have been moved or deleted.
      </p>

      {/* Helpful Links */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 shadow-sm transition"
        >
          Go back home
        </Link>
        <Link
          href="/manufacturers"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          Search manufacturers
        </Link>
        <Link
          href="/leads/new"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          Submit sourcing request
        </Link>
      </div>
    </div>
  );
}
