import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getInfraProjects,
  getInfraFilterOptions,
  type InfraFilters as InfraFiltersType,
} from "@/lib/queries";
import { InfraProjectCard } from "@/components/InfraProjectCard";
import { InfraFilters } from "@/components/InfraFilters";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Singapore Infrastructure Project Pipeline",
  description:
    "Track government infrastructure projects across Singapore — rail, roads, housing, and utilities. Filter by agency, type, and status. Built for B2B contractors and suppliers.",
  alternates: { canonical: "/infrastructure" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function param(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function InfrastructurePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters: InfraFiltersType = {
    q: param(sp.q),
    agency: param(sp.agency),
    project_type: param(sp.project_type),
    status: param(sp.status),
    page: param(sp.page) ? Number(param(sp.page)) : 1,
  };

  const [result, options] = await Promise.all([
    getInfraProjects(filters),
    getInfraFilterOptions(),
  ]);

  const baseQuery: Record<string, string | undefined> = {
    q: filters.q,
    agency: filters.agency,
    project_type: filters.project_type,
    status: filters.status,
  };

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Singapore Infrastructure Pipeline
        </h1>
        <p className="mt-2 text-slate-600">
          {result.total.toLocaleString()} infrastructure projects tracked. Filter
          by agency, type, and construction status.
        </p>
      </header>

      <Suspense fallback={<div className="h-12" />}>
        <InfraFilters
          agencies={options.agencies}
          projectTypes={options.projectTypes}
        />
      </Suspense>

      {result.projects.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No projects found
          </h2>
          <p className="mt-2 text-slate-500">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.projects.map((p) => (
            <InfraProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        baseQuery={baseQuery}
        basePath="/infrastructure"
      />
    </div>
  );
}
