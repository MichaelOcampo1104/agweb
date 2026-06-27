import type { MetadataRoute } from "next";
import { createClient } from "@/lib/server";

/**
 * Dynamic sitemap: homepage + static pages + every manufacturer + certifier page.
 * SEO is the primary traffic channel, so this is wired up from the start.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/manufacturers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/certifiers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/leads/new`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  const supabase = await createClient();
  const { data } = await supabase
    .from("manufacturers")
    .select("slug, updated_at")
    .limit(5000);

  const manufacturerPages: MetadataRoute.Sitemap = (data ?? []).map((m) => ({
    url: `${base}/manufacturers/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...manufacturerPages];
}
