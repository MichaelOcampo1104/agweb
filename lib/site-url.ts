/**
 * Canonical site URL — the single source of truth for sitemap.ts, robots.ts,
 * and layout.tsx (metadataBase / canonical / OpenGraph).
 *
 * Set NEXT_PUBLIC_SITE_URL to your real domain in production (e.g. in the
 * Vercel project env vars). If it's missing — or still pointing at localhost —
 * during a production build, we warn loudly: the sitemap and canonical URLs
 * would resolve to localhost, and Google would silently ignore every page.
 */

const raw = process.env.NEXT_PUBLIC_SITE_URL;
const isProd = process.env.NODE_ENV === "production";

const FALLBACK = "http://localhost:3000";

function looksUnset(u?: string): boolean {
  return !u || u.includes("localhost") || u.includes("127.0.0.1");
}

// Warn once per warm server instance (re-fires on cold starts, which is fine).
let warned = false;

export const SITE_URL = (() => {
  if (raw && !looksUnset(raw)) return raw.replace(/\/+$/, ""); // strip trailing slash

  if (isProd && !warned) {
    console.warn(
      "[sourcify] NEXT_PUBLIC_SITE_URL is not set (or points at localhost) in " +
        "production. sitemap.xml, robots.txt, and canonical URLs will resolve " +
        "to localhost, so Google will NOT index the site. Set " +
        "NEXT_PUBLIC_SITE_URL to your production domain (Vercel → Project " +
        "Settings → Environment Variables).",
    );
    warned = true;
  }
  return FALLBACK;
})();

/** Join the site URL with a path, normalizing leading slashes. */
export function siteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
