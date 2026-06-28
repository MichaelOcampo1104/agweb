import type { MetadataRoute } from "next";
import { createClient } from "@/lib/server";
import { siteUrl } from "@/lib/site-url";

/**
 * Dynamic sitemap covering every indexable route:
 * homepage + static pages + certifier directory + all manufacturer detail
 * pages + all infrastructure detail pages.
 *
 * SEO is the primary traffic channel, so this is wired up from the start.
 * Detail URLs here must resolve to 200s — only emit a `[slug]` URL if a
 * corresponding page route exists.
 *
 * Wrapped in try/catch so Google always gets at least the static pages even
 * if Supabase is slow or unreachable — a partial sitemap is infinitely better
 * than a 500 error that causes "Couldn't fetch" in Search Console.
 */

// Revalidate the sitemap at most once every 5 minutes so Googlebot doesn't
// trigger a cold start + Supabase query on every fetch.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/manufacturers"), lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/certifiers"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: siteUrl("/infrastructure"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: siteUrl("/leads/new"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const supabase = await createClient();

    // Detail pages are queried in parallel — independent reads.
    const [manufacturers, infraProjects] = await Promise.all([
      supabase
        .from("manufacturers")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("infrastructure_projects")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5000),
    ]);

    const manufacturerPages: MetadataRoute.Sitemap = (manufacturers.data ?? []).map(
      (m: { slug: string; updated_at: string | null }) => ({
        url: siteUrl(`/manufacturers/${m.slug}`),
        lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    );

    const infraPages: MetadataRoute.Sitemap = (infraProjects.data ?? []).map(
      (p: { slug: string; updated_at: string | null }) => ({
        url: siteUrl(`/infrastructure/${p.slug}`),
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    );

    return [...staticPages, ...manufacturerPages, ...infraPages];
  } catch (error) {
    console.error("[sitemap] Supabase query failed, returning static pages only:", error);
    return staticPages;
  }
}
