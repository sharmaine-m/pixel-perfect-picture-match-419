import { queryOptions } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export const threadsQuery = queryOptions({
  queryKey: ["threads"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const threadMessagesQuery = (threadId: string) =>
  queryOptions({
    queryKey: ["thread-messages", threadId],
    staleTime: Infinity,
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("message_id, role, parts")
        .eq("thread_id", threadId)
        .order("created_at");
      if (error) throw error;
      return data.map((r) => ({
        id: r.message_id,
        role: r.role as UIMessage["role"],
        parts: r.parts as unknown as UIMessage["parts"],
      }));
    },
  });

export async function createThread() {
  const { data, error } = await supabase.from("chat_threads").insert({}).select("id").single();
  if (error) throw error;
  return data.id;
}
