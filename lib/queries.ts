import { createClient } from "@/lib/server";
import type { Database } from "@/lib/db/database.types";

export type Manufacturer = Database["public"]["Tables"]["manufacturers"]["Row"];
export type CertBody = Database["public"]["Tables"]["certification_bodies"]["Row"];
export type DirectoryStats = Database["public"]["Views"]["directory_stats"]["Row"];

export const PAGE_SIZE = 24;

export type DirectoryFilters = {
  q?: string;
  country?: string;
  cert_body?: string;
  industry?: string;
  status?: string;
  page?: number;
};

/** Distinct values for the directory's filter dropdowns. */
export async function getFilterOptions() {
  const supabase = await createClient();

  const [countries, industries, certBodies] = await Promise.all([
    supabase.from("manufacturers").select("country").order("country"),
    supabase.from("manufacturers").select("industries"),
    supabase.from("certification_bodies").select("name").order("name"),
  ]);

  const countrySet = new Set<string>();
  (countries.data ?? []).forEach((r: { country: string | null }) => {
    if (r.country) countrySet.add(r.country);
  });

  const industrySet = new Set<string>();
  (industries.data ?? []).forEach((r: { industries: string[] | null }) =>
    (r.industries ?? []).forEach((i: string) => industrySet.add(i)),
  );

  return {
    countries: [...countrySet].sort(),
    industries: [...industrySet].sort(),
    certBodies: (certBodies.data ?? []).map((r: { name: string }) => r.name),
  };
}

/** Paginated, filtered manufacturer directory (server-rendered for SEO). */
export async function getManufacturers(filters: DirectoryFilters = {}) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("manufacturers")
    .select("*", { count: "exact" })
    .order("featured", { ascending: false })  // paid listings first
    .order("name", { ascending: true })
    .range(from, to);

  if (filters.q) {
    // Full-text search via the generated search_vector + GIN index.
    const term = filters.q.trim().replace(/\s+/g, " & ");
    query = query.textSearch("search_vector", term);
  }
  if (filters.country) query = query.eq("country", filters.country);
  if (filters.cert_body) query = query.eq("cert_body", filters.cert_body);
  if (filters.industry) query = query.contains("industries", [filters.industry]);
  if (filters.status) query = query.eq("cert_status", filters.status);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    manufacturers: (data ?? []) as Manufacturer[],
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

/** Single manufacturer by slug (detail page). */
export async function getManufacturerBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manufacturers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Manufacturer | null) ?? null;
}

/** Related manufacturers in the same country (for internal-linking / SEO). */
export async function getRelatedManufacturers(m: Manufacturer, limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("manufacturers")
    .select("name, slug, country, city, cert_body, industries")
    .eq("country", m.country)
    .neq("id", m.id)
    .limit(limit);
  return (data ?? []) as Pick<
    Manufacturer,
    "name" | "slug" | "country" | "city" | "cert_body" | "industries"
  >[];
}

/** Homepage live stats. */
export async function getDirectoryStats(): Promise<DirectoryStats> {
  const supabase = await createClient();
  const { data } = await supabase.from("directory_stats").select("*").maybeSingle();
  return (
    data ?? {
      manufacturer_count: 0,
      country_count: 0,
      certifier_count: 0,
      active_certifier_count: 0,
    }
  );
}

/** Top countries for the homepage (by manufacturer count). */
export async function getTopCountries(limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase.from("manufacturers").select("country");
  const counts = new Map<string, number>();
  (data ?? []).forEach((r: { country: string | null }) => {
    if (r.country) counts.set(r.country, (counts.get(r.country) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Global certification-body directory. */
export async function getCertBodies(filters: { country?: string } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("certification_bodies")
    .select("*")
    .order("name", { ascending: true });
  if (filters.country) query = query.eq("country", filters.country);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CertBody[];
}

export async function getCertBodyCountries() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certification_bodies")
    .select("country")
    .not("country", "is", null)
    .order("country");
  const set = new Set<string>();
  (data ?? []).forEach((r: { country: string | null }) => r.country && set.add(r.country));
  return [...set].sort();
}

// ---------------------------------------------------------------------------
// Infrastructure projects (Singapore pipeline)
// ---------------------------------------------------------------------------

export type InfraProject = Database["public"]["Tables"]["infrastructure_projects"]["Row"];

export type InfraFilters = {
  q?: string;
  agency?: string;
  project_type?: string;
  status?: string;
  page?: number;
};

export const INFRA_PAGE_SIZE = 24;

export async function getInfraFilterOptions() {
  const supabase = await createClient();

  const [agencies, types] = await Promise.all([
    supabase.from("infrastructure_projects").select("agency").order("agency"),
    supabase.from("infrastructure_projects").select("project_type"),
  ]);

  const agencySet = new Set<string>();
  (agencies.data ?? []).forEach((r: { agency: string }) => agencySet.add(r.agency));

  const typeSet = new Set<string>();
  (types.data ?? []).forEach((r: { project_type: string | null }) => {
    if (r.project_type) typeSet.add(r.project_type);
  });

  return {
    agencies: [...agencySet].sort(),
    projectTypes: [...typeSet].sort(),
  };
}

export async function getInfraProjects(filters: InfraFilters = {}) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * INFRA_PAGE_SIZE;
  const to = from + INFRA_PAGE_SIZE - 1;

  let query = supabase
    .from("infrastructure_projects")
    .select("*", { count: "exact" })
    .order("status", { ascending: true })
    .order("name", { ascending: true })
    .range(from, to);

  if (filters.q) {
    const term = filters.q.trim().replace(/\s+/g, " & ");
    query = query.textSearch("search_vector", term);
  }
  if (filters.agency) query = query.eq("agency", filters.agency);
  if (filters.project_type) query = query.eq("project_type", filters.project_type);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    projects: (data ?? []) as InfraProject[],
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / INFRA_PAGE_SIZE)),
  };
}

export async function getInfraProjectBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("infrastructure_projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as InfraProject | null) ?? null;
}
