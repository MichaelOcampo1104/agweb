/**
 * Build-time script: generates a static public/sitemap.xml so Google
 * never hits a cold-starting serverless function.
 *
 * Run before `next build` — wired into the "build" npm script.
 *
 * Uses the service-role key so it can read all rows. The key is only
 * exposed at build time (CI / local), never in the browser bundle.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env locally (Vercel injects env vars directly in production)
const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const outPath = resolve(__dirname, "..", "public", "sitemap.xml");

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://agweb-gold.vercel.app").replace(/\/+$/, "");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEl(loc, { lastmod, changefreq = "monthly", priority = 0.6 } = {}) {
  const parts = [`  <loc>${esc(loc)}</loc>`];
  if (lastmod) parts.push(`  <lastmod>${new Date(lastmod).toISOString()}</lastmod>`);
  if (changefreq) parts.push(`  <changefreq>${changefreq}</changefreq>`);
  if (priority != null) parts.push(`  <priority>${priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

async function main() {
  console.log("[generate-sitemap] Querying Supabase...");

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

  if (manufacturers.error) {
    console.warn("[generate-sitemap] manufacturers query failed:", manufacturers.error.message);
  }
  if (infraProjects.error) {
    console.warn("[generate-sitemap] infrastructure_projects query failed:", infraProjects.error.message);
  }

  const urls = [
    // Static pages
    urlEl(`${SITE_URL}/`, { changefreq: "weekly", priority: 1 }),
    urlEl(`${SITE_URL}/manufacturers`, { changefreq: "daily", priority: 0.9 }),
    urlEl(`${SITE_URL}/certifiers`, { changefreq: "weekly", priority: 0.7 }),
    urlEl(`${SITE_URL}/infrastructure`, { changefreq: "weekly", priority: 0.7 }),
    urlEl(`${SITE_URL}/leads/new`, { changefreq: "monthly", priority: 0.4 }),

    // Manufacturer detail pages
    ...(manufacturers.data ?? []).map((m) =>
      urlEl(`${SITE_URL}/manufacturers/${m.slug}`, {
        lastmod: m.updated_at,
        changefreq: "monthly",
        priority: 0.6,
      }),
    ),

    // Infrastructure detail pages
    ...(infraProjects.data ?? []).map((p) =>
      urlEl(`${SITE_URL}/infrastructure/${p.slug}`, {
        lastmod: p.updated_at,
        changefreq: "weekly",
        priority: 0.6,
      }),
    ),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "", // trailing newline
  ].join("\n");

  writeFileSync(outPath, xml, "utf-8");
  console.log(`[generate-sitemap] Written ${urls.length} URLs to ${outPath}`);
}

main().catch((err) => {
  console.error("[generate-sitemap] Fatal error:", err);
  process.exit(1);
});
