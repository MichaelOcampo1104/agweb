import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

/**
 * GET /api/manufacturers?q=...&country=...&industry=...&cert_body=...&limit=...
 *
 * Lightweight JSON search endpoint. Powers UI typeahead and is also consumable
 * by external apps. Mirrors the directory's filter logic but returns JSON.
 * Reads are public (anon) per RLS.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const country = url.searchParams.get("country");
  const industry = url.searchParams.get("industry");
  const certBody = url.searchParams.get("cert_body");
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 20));

  const supabase = await createClient();
  let query = supabase
    .from("manufacturers")
    .select("name, slug, country, city, cert_body, industries")
    .order("name", { ascending: true })
    .limit(limit);

  if (q) {
    const term = q.replace(/\s+/g, " & ");
    query = query.textSearch("search_vector", term);
  }
  if (country) query = query.eq("country", country);
  if (certBody) query = query.eq("cert_body", certBody);
  if (industry) query = query.contains("industries", [industry]);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ results: data ?? [], count: (data ?? []).length });
}
