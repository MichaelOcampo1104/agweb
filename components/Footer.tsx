import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
              S
            </span>
            Sourcify
          </div>
          <p className="mt-3 text-sm text-slate-500">
            B2B data aggregation platform — halal-certified manufacturers, infrastructure projects, and more.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Directory</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/manufacturers" className="hover:text-brand-700">Manufacturers</Link></li>
            <li><Link href="/certifiers" className="hover:text-brand-700">Certifiers</Link></li>
            <li><Link href="/infrastructure" className="hover:text-brand-700">Infrastructure</Link></li>
            <li><Link href="/leads/new" className="hover:text-brand-700">List your company</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Sources</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <a
                href="https://www.jakim.gov.my/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-brand-700"
              >
                JAKIM (Malaysia)
              </a>
            </li>
            <li>
              <a
                href="https://www.halalfoundation.org/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-brand-700"
              >
                Halal Foundation
              </a>
            </li>
            <li>
              <a
                href="https://data.gov.sg/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-brand-700"
              >
                data.gov.sg
              </a>
            </li>
            <li>Public certifier lists</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">About</h4>
          <p className="mt-3 text-sm text-slate-500">
            Data aggregated from public sources for B2B buyers, importers, contractors, and sourcing teams worldwide.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Sourcify. Data aggregated from public sources.
      </div>
    </footer>
  );
}
