import Link from "next/link";
import type { InfraProject } from "@/lib/queries";

const STATUS_BADGES: Record<string, string> = {
  proposed: "bg-slate-100 text-slate-700",
  planning: "bg-purple-100 text-purple-700",
  tendering: "bg-amber-100 text-amber-700",
  under_construction: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposed",
  planning: "Planning",
  tendering: "Tendering",
  under_construction: "Under Construction",
  completed: "Completed",
};

export function InfraProjectCard({ project }: { project: InfraProject }) {
  return (
    <Link
      href={`/infrastructure/${project.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{project.agency}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGES[project.status] ?? "bg-slate-100 text-slate-700"}`}
        >
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      {project.description && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
          {project.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>{project.project_type?.replace(/_/g, " ") ?? "—"}</span>
        {project.expected_completion && (
          <span>Est. {project.expected_completion}</span>
        )}
      </div>
    </Link>
  );
}
