import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Uses the PUBLIC anon key — safe to expose to the
 * client because Row Level Security only allows public READ of manufacturers
 * and certification_bodies (and public INSERT of leads). No writes to data
 * tables are possible with this key. See db/schema.sql.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
