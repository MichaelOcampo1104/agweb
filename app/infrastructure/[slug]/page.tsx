import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInfraProjectBySlug } from "@/lib/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getInfraProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  return {
    title: `${project.name} — Singapore Infrastructure Pipeline`,
    description:
      project.description ??
      `${project.agency} ${project.project_type} project — status: ${project.status}`,
    alternates: { canonical: `/infrastructure/${project.slug}` },
  };
}

const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposed",
  planning: "Planning",
  tendering: "Tendering",
  under_construction: "Under Construction",
  completed: "Completed",
};

export default async function InfraProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getInfraProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <a href="/infrastructure" className="hover:text-brand-700">
          ← Infrastructure Pipeline
        </a>
      </nav>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {project.agency}
          </span>
          {project.project_type && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {project.project_type.replace(/_/g, " ")}
            </span>
          )}
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          {project.name}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {project.description && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">
                Description
              </h2>
              <p className="mt-2 text-slate-600">{project.description}</p>
            </section>
          )}

          {project.location && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Location</h2>
              <p className="mt-2 text-slate-600">{project.location}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Project Details
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              {project.budget != null && (
                <div>
                  <dt className="text-slate-500">Budget</dt>
                  <dd className="font-medium text-slate-900">
                    SGD {project.budget.toLocaleString()}
                  </dd>
                </div>
              )}
              {project.start_date && (
                <div>
                  <dt className="text-slate-500">Start Date</dt>
                  <dd className="font-medium text-slate-900">
                    {project.start_date}
                  </dd>
                </div>
              )}
              {project.expected_completion && (
                <div>
                  <dt className="text-slate-500">Expected Completion</dt>
                  <dd className="font-medium text-slate-900">
                    {project.expected_completion}
                  </dd>
                </div>
              )}
              {project.actual_completion && (
                <div>
                  <dt className="text-slate-500">Actual Completion</dt>
                  <dd className="font-medium text-slate-900">
                    {project.actual_completion}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {project.contractor_name && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Contractor
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {project.contractor_name}
              </p>
              {project.contractor_contact && (
                <p className="mt-1 text-xs text-slate-500">
                  {project.contractor_contact}
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Source</h3>
            <p className="mt-2 text-xs text-slate-500">
              Data from{" "}
              <a
                href={project.source_url}
                className="text-brand-700 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.source}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
