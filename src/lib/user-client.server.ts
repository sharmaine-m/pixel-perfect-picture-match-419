import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Verifies the bearer token on a raw server-route request and returns an RLS-scoped client. */
export async function getUserClient(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend not configured");
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token.split(".").length !== 3) return null;

  const supabase = createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub as string };
}

export function json(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

type Client = NonNullable<Awaited<ReturnType<typeof getUserClient>>>["supabase"];

export async function tasksContext(supabase: Client) {
  const { data } = await supabase
    .from("tasks")
    .select("title, description, priority, deadline, status, progress")
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(60);
  if (!data?.length) return "The user has no tasks yet.";
  return data
    .map(
      (t) =>
        `- ${t.title} [priority: ${t.priority}, status: ${t.status}, progress: ${t.progress}%${
          t.deadline ? `, due: ${new Date(t.deadline).toISOString()}` : ""
        }]${t.description ? ` — ${t.description}` : ""}`,
    )
    .join("\n");
}
