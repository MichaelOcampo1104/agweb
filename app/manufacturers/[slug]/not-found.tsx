import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">404</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Manufacturer not found</h1>
      <p className="mt-3 text-slate-600">
        This company may have been removed or the link is incorrect.
      </p>
      <Link
        href="/manufacturers"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
      >
        Browse all manufacturers
      </Link>
    </div>
  );
}
