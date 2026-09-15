import { Request, Response, NextFunction } from "express";
import { createAuthSupabase } from "../lib/supabase";
import { getSupabaseAnonKey, getSupabaseUrl } from "../lib/supabaseKeys";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Missing or invalid Authorization header" });
    return;
  }
  const token = auth.slice(7).trim();

  if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
    res.status(500).json({ detail: "Server auth is not configured" });
    return;
  }

  const authClient = createAuthSupabase();
  const { data } = await authClient.auth.getUser(token);
  if (!data.user) {
    res.status(401).json({ detail: "Invalid or expired token" });
    return;
  }

  res.locals.userId = data.user.id;
  res.locals.userEmail = data.user.email?.toLowerCase() ?? "";
  res.locals.token = token;
  next();
}
