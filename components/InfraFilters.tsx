"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  agencies: string[];
  projectTypes: string[];
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "proposed", label: "Proposed" },
  { value: "planning", label: "Planning" },
  { value: "tendering", label: "Tendering" },
  { value: "under_construction", label: "Under Construction" },
  { value: "completed", label: "Completed" },
];

export function InfraFilters({ agencies, projectTypes }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const current = (key: string) => params.get(key) ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page"); // reset to page 1 on filter change
      router.push(`/infrastructure?${next.toString()}`);
    },
    [params, router],
  );

  const select =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className={select}
        value={current("agency")}
        onChange={(e) => update("agency", e.target.value)}
      >
        <option value="">All agencies</option>
        {agencies.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select
        className={select}
        value={current("project_type")}
        onChange={(e) => update("project_type", e.target.value)}
      >
        <option value="">All types</option>
        {projectTypes.map((t) => (
          <option key={t} value={t}>
            {t.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <select
        className={select}
        value={current("status")}
        onChange={(e) => update("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
