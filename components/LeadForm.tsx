"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
const labelClass = "block text-sm font-medium text-slate-700";

/**
 * Public lead-submission form. Posts to /api/leads, which inserts into the
 * `leads` table (public INSERT is allowed by RLS; reads are service-role only).
 * This is the lead-gen monetization surface described in the brief.
 */
export function LeadForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      company: String(fd.get("company") ?? "") || null,
      country: String(fd.get("country") ?? "") || null,
      message: String(fd.get("message") ?? ""),
      target_country: String(fd.get("target_country") ?? "") || null,
      industries: String(fd.get("industries") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.text()) || "Submission failed");
      setStatus("done");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700">
          ✓
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Request received</h2>
        <p className="mt-2 text-slate-600">
          Thanks — we&apos;ll be in touch with matched suppliers shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">Your name *</label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="company">Company</label>
          <input id="company" name="company" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="country">Your country</label>
          <input id="country" name="country" className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="target_country">Sourcing from (country)</label>
          <input id="target_country" name="target_country" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="industries">Industries (comma-separated)</label>
          <input id="industries" name="industries" placeholder="Food, Cosmetics" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="message">What are you sourcing? *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder="e.g. Halal-certified frozen poultry producers in Brazil for EU import"
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {status === "loading" ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
