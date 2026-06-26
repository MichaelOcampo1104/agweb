import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server (RSC / route-handler) Supabase client. Same anon-key/RLS guarantees as
 * the browser client, but cookie-backed so it works in Server Components and
 * route handlers. Reads happen at request time on the server for SEO.
 *
 * In Next.js 16 `cookies()` returns a Promise, so this function is async.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never),
            );
          } catch {
            // Called from a Server Component — safe to ignore when middleware
            // refreshes user sessions.
          }
        },
      },
    },
  );
}
