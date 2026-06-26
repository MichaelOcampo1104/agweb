import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Request Halal-Certified Suppliers",
  description:
    "Tell us what you're sourcing and we'll match you with qualified, halal-certified manufacturers.",
  alternates: { canonical: "/leads/new" },
};

export default function NewLeadPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Request certified suppliers
        </h1>
        <p className="mt-3 text-slate-600">
          Looking for halal-certified manufacturers you can&apos;t find in the
          directory? Describe what you need and we&apos;ll match you with
          qualified suppliers. Free for buyers.
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
          <LeadForm />
        </div>
      </div>
    </div>
  );
}
