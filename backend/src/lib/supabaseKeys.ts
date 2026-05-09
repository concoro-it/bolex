import crypto from "crypto";

function base64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signSupabaseJwt(secret: string, role: "anon" | "service_role"): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    JSON.stringify({
      iss: "supabase",
      ref: "local",
      role,
      iat: now,
      exp: now + 10 * 365 * 24 * 60 * 60,
    }),
  );
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest();
  return `${header}.${payload}.${base64Url(signature)}`;
}

function resolveKey(role: "anon" | "service_role"): string {
  const explicit =
    role === "service_role"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (explicit) return explicit;

  const legacy = process.env.SUPABASE_SECRET_KEY ?? "";
  if (!legacy) return "";

  // Some self-hosted Supabase installs expose the raw JWT secret here.
  // PostgREST expects a signed anon/service-role JWT as the API key.
  if (!legacy.startsWith("eyJ")) {
    return signSupabaseJwt(legacy, role);
  }

  return legacy;
}

export function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabaseServiceKey(): string {
  return resolveKey("service_role");
}

export function getSupabaseAnonKey(): string {
  return resolveKey("anon");
}
