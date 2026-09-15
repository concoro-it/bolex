import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceKey,
  getSupabaseUrl,
} from "./supabaseKeys";

/**
 * Server-side Supabase client using the service role key.
 * Bypasses RLS — only use in API routes after verifying the user.
 */
export function createServerSupabase() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Client used only to validate end-user access tokens.
 * Token verification does not require the privileged service key, and using
 * the publishable/anon key also works with Supabase's newer sb_secret keys.
 */
export function createAuthSupabase() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false },
  });
}

/**
 * Extract and verify the Supabase JWT from the Authorization header.
 * Returns the user's UUID string, or throws a Response with 401.
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    throw new Response("Missing or invalid Authorization header", {
      status: 401,
    });
  }
  const token = auth.slice(7).trim();

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    throw new Response("Server auth is not configured", { status: 500 });
  }

  const authClient = createAuthSupabase();
  const { data } = await authClient.auth.getUser(token);
  if (!data.user) {
    throw new Response("Invalid or expired token", { status: 401 });
  }
  return data.user.id;
}
