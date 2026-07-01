import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site-url";
import { getCertBodyBySlug, getManufacturersByCertBody } from "@/lib/queries";
import { statusBadge } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const body = await getCertBodyBySlug(slug);
  if (!body) return { title: "Certifier not found" };
  return {
    title: `${body.name} — Halal Certification Body`,
    description: `${body.name} is a halal certification authority${body.country ? ` in ${body.country}` : ""}. Browse all manufacturers certified by ${body.name}.`,
    alternates: { canonical: `/certifiers/${body.slug}` },
  };
}

export default async function CertifierDetailPage({ params }: Props) {
  const { slug } = await params;
  const [body, manufacturers] = await Promise.all([
    getCertBodyBySlug(slug),
    // manufacturers fetched after we have the body name — resolved below
    Promise.resolve(null),
  ]);

  if (!body) notFound();

  const certifiedManufacturers = await getManufacturersByCertBody(body.name);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: body.name,
    url: body.website ?? undefined,
    email: body.email ?? undefined,
    address: body.country
      ? { "@type": "PostalAddress", addressCountry: body.country }
      : undefined,
    description: `Halal certification body${body.country ? ` in ${body.country}` : ""}`,
  });

  return (
    <div className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
              { "@type": "ListItem", "position": 2, "name": "Certifiers", "item": `${SITE_URL}/certifiers` },
              { "@type": "ListItem", "position": 3, "name": body.name, "item": `${SITE_URL}/certifiers/${body.slug}` }
            ]
          })
        }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/certifiers" className="hover:text-brand-700">Certifiers</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{body.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-700">
              {body.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{body.name}</h1>
              <p className="mt-1 text-slate-600">
                {[body.region, body.country].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {/* Details */}
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">About this certifier</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {body.country && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Country</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{body.country}</dd>
                </div>
              )}
              {body.region && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Region</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{body.region}</dd>
                </div>
              )}
              {body.recognized_by?.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Recognized by</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {body.recognized_by.map((r) => (
                      <span
                        key={r}
                        className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                      >
                        {r}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {body.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Notes</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{body.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Certified manufacturers */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">
              Manufacturers certified by {body.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {certifiedManufacturers.length > 0
                ? `${certifiedManufacturers.length} manufacturer${certifiedManufacturers.length === 1 ? "" : "s"} listed`
                : "No manufacturers on record yet for this certifier."}
            </p>

            {certifiedManufacturers.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {certifiedManufacturers.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/manufacturers/${m.slug}`}
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
                          {m.name}
                        </div>
                        <div className="mt-0.5 truncate text-sm text-slate-500">
                          {[m.city, m.country].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadge(m.cert_status)}`}
                      >
                        {m.cert_status}
                      </span>
                    </div>
                    {m.industries?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
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
                  </Link>
                ))}
              </div>
            )}

            {certifiedManufacturers.length > 0 && (
              <div className="mt-6">
                <Link
                  href={`/manufacturers?cert_body=${encodeURIComponent(body.name)}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  View all manufacturers certified by {body.name} →
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Contact &amp; links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {body.website && (
                <li>
                  <a
                    href={body.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-brand-700 hover:underline"
                  >
                    Visit website →
                  </a>
                </li>
              )}
              {body.email && (
                <li>
                  <a href={`mailto:${body.email}`} className="text-brand-700 hover:underline">
                    {body.email}
                  </a>
                </li>
              )}
              {body.phone && <li className="text-slate-600">{body.phone}</li>}
              {!body.website && !body.email && !body.phone && (
                <li className="text-slate-400">No contact details on file.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
            <h2 className="font-semibold text-slate-900">Need a certified supplier?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Submit a sourcing request and we&apos;ll match you with manufacturers
              certified by {body.name} and similar bodies.
            </p>
            <Link
              href="/leads/new"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Request suppliers
            </Link>
          </div>

          {body.source_url && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Data source</h2>
              <p className="mt-2 text-sm text-slate-500">
                Certifier data aggregated from public registries.
              </p>
              <a
                href={body.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 block text-sm text-brand-700 hover:underline"
              >
                View original source →
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
