import { DefaultChatTransport } from "ai";
import { supabase } from "@/integrations/supabase/client";

export function authedTransport(api: string, body: Record<string, unknown>) {
  return new DefaultChatTransport({
    api,
    body,
    headers: async (): Promise<Record<string, string>> => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
}

export function aiErrorMessage(error: Error) {
  const msg = error.message || "";
  if (msg.includes("429")) return "Too many requests — please wait a moment and try again.";
  if (msg.includes("402")) return "AI credits have run out. Add credits in your workspace to continue.";
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error) return String(parsed.error);
  } catch {
    /* not json */
  }
  return msg || "Something went wrong reaching the AI. Please try again.";
}
