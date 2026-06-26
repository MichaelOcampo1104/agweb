import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

/**
 * POST /api/leads  — public lead submission (lead-gen monetization surface).
 * RLS allows anon INSERT into leads; only the service role can read them back.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "name, email, and message are required" },
      { status: 422 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name,
      email,
      message,
      company: body.company ?? null,
      country: body.country ?? null,
      target_country: body.target_country ?? null,
      industries: Array.isArray(body.industries) ? body.industries : [],
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
