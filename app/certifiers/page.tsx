import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site-url";
import { getCertBodies } from "@/lib/queries";
import { CertifierSearchList } from "@/components/CertifierSearchList";

export const metadata: Metadata = {
  title: "Global Halal Certification Bodies Directory",
  description:
    "Browse halal certification bodies worldwide — recognized authorities that certify manufacturers, with their country and accreditation.",
  alternates: { canonical: "/certifiers" },
};

export default async function CertifiersPage() {
  const bodies = await getCertBodies();

  // group by country to count them on server
  const countriesSet = new Set<string>();
  bodies.forEach((b) => b.country && countriesSet.add(b.country));

  const breadcrumbJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Certifiers",
        "item": `${SITE_URL}/certifiers`
      }
    ]
  });

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Halal Certification Bodies
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          The authorities that grant halal certification worldwide. Each body
          audits and certifies manufacturers in its region. {bodies.length} bodies
          across {countriesSet.size} countries.
        </p>
      </header>

      {bodies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No certifier data yet. Run the scrapers to populate this directory
          (see the README).
        </div>
      ) : (
        <CertifierSearchList bodies={bodies} />
      )}

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Looking for manufacturers certified by a specific body?{" "}
        <Link href="/manufacturers" className="font-medium text-brand-700 hover:underline">
          Browse the manufacturer directory →
        </Link>
      </div>
    </div>
  );
}
