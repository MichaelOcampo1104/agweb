import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getManufacturerBySlug,
  getRelatedManufacturers,
} from "@/lib/queries";
import { initial, statusBadge } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Dynamic metadata for SEO + social shares. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = await getManufacturerBySlug(slug);
  if (!m) return { title: "Manufacturer not found" };
  return {
    title: `${m.name} — Halal-Certified Manufacturer`,
    description: `${m.name} is a halal-certified manufacturer in ${[m.city, m.country]
      .filter(Boolean)
      .join(", ")}. ${m.industries?.length ? `Industries: ${m.industries.join(", ")}.` : ""}`,
    alternates: { canonical: `/manufacturers/${m.slug}` },
  };
}

/** JSON-LD structured data for rich results (Organization + certification). */
function jsonLd(m: Awaited<ReturnType<typeof getManufacturerBySlug>>) {
  if (!m) return null;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: m.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: m.city,
      addressCountry: m.country,
    },
  };
  if (m.website) data.url = m.website;
  if (m.email) data.email = m.email;
  if (m.cert_body) {
    data.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      name: `Halal certification — ${m.cert_body}`,
      credentialStatus: m.cert_status,
    };
  }
  return JSON.stringify(data);
}

function generateBlurb(m: any) {
  const industries = m.industries?.length > 0 ? m.industries.join(", ") : "";
  const location = [m.city, m.country].filter(Boolean).join(", ");
  const certBody = m.cert_body ? `certified by ${m.cert_body}` : "halal-certified";

  let blurb = `${m.name} is a halal-certified supplier based in ${location}. `;
  if (industries) {
    blurb += `The company operates within the ${industries} sector. `;
  }
  if (m.cert_number) {
    blurb += `Their certification number is ${m.cert_number}. `;
  }
  if (m.products?.length > 0) {
    blurb += `They offer a range of products including: ${m.products.slice(0, 8).join(", ")}. `;
  }
  blurb += `They are officially ${certBody} ensuring conformity to global halal standards.`;

  return blurb;
}

export default async function ManufacturerDetailPage({ params }: Props) {
  const { slug } = await params;
  const m = await getManufacturerBySlug(slug);
  if (!m) notFound();

  const related = await getRelatedManufacturers(m);
  const isFeatured = m.featured && (!m.featured_until || new Date(m.featured_until) > new Date());

  const raw = m.raw_payload as { description?: string } | null;
  const description = raw?.description;

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(m)! }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/manufacturers" className="hover:text-brand-700">Manufacturers</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{m.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-700">
              {initial(m.name)}
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">{m.name}</h1>
                {isFeatured && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-amber-700">
                    Featured
                  </span>
                )}
              </div>
              <p className="mt-1 text-slate-600">
                {[m.city, m.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          {/* About Section */}
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">About {m.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {description || generateBlurb(m)}
            </p>
          </section>

          {/* Certification block */}
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Halal certification</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Certifying body</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {m.cert_body || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Certificate number</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{m.cert_number || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Status</dt>
                <dd className="mt-0.5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadge(m.cert_status)}`}
                  >
                    {m.cert_status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Valid until</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {m.cert_valid_until
                    ? new Date(m.cert_valid_until).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Last verified</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {new Date(m.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              {m.source_url && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Source</dt>
                  <dd className="mt-0.5">
                    <a
                      href={m.source_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-sm text-brand-700 hover:underline"
                    >
                      View original record →
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Industries / products */}
          {(m.industries?.length > 0 || m.products?.length > 0) && (
            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
              {m.industries?.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-slate-900">Industries</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.industries.map((i) => (
                      <Link
                        key={i}
                        href={`/manufacturers?industry=${encodeURIComponent(i)}`}
                        className="rounded-lg bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-100"
                      >
                        {i}
                      </Link>
                    ))}
                  </div>
                </>
              )}
              {m.products?.length > 0 && (
                <>
                  <h2 className="mt-6 text-lg font-semibold text-slate-900">Products</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {m.products.map((p) => (
                      <li key={p} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700">
                        {p}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Contact & links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {m.website && (
                <li>
                  <a
                    href={m.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-brand-700 hover:underline"
                  >
                    Visit website →
                  </a>
                </li>
              )}
              {m.email && (
                <li>
                  <a href={`mailto:${m.email}`} className="text-brand-700 hover:underline">
                    {m.email}
                  </a>
                </li>
              )}
              {m.phone && <li className="text-slate-600">{m.phone}</li>}
              {!m.website && !m.email && !m.phone && (
                <li className="text-slate-400">No contact details on file.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
            <h2 className="font-semibold text-slate-900">Need a supplier like this?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Submit a sourcing request and we&apos;ll match you with qualified,
              certified manufacturers.
            </p>
            <Link
              href="/leads/new"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Request suppliers
            </Link>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-slate-900">
            More manufacturers in {m.country}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/manufacturers/${r.slug}`}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300"
              >
                <div className="font-medium text-slate-900">{r.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {[r.city, r.country].filter(Boolean).join(", ")}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
