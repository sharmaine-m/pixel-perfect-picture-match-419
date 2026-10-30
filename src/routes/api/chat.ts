import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/lib/ai/responses.server";
import { withLovableAiGatewayRunIdHeader } from "@/lib/ai/run-id.server";
import { getUserClient, json, tasksContext } from "@/lib/user-client.server";
import type { Json } from "@/integrations/supabase/types";

function textOf(m: UIMessage) {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUserClient(request);
        if (!user) return json(401, "Please sign in again.");
        const { supabase, userId } = user;

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        const messages = body.messages;
        if (!Array.isArray(messages) || !body.threadId) return json(400, "Invalid request");
        const threadId = body.threadId;

        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return json(404, "Conversation not found");

        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const { error } = await supabase.from("chat_messages").upsert(
            {
              thread_id: threadId,
              user_id: userId,
              message_id: last.id,
              role: "user",
              parts: last.parts as unknown as Json,
            },
            { onConflict: "thread_id,message_id" },
          );
          if (error) console.error("save user message failed", error);
          const update: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
          if (thread.title === "New chat") update.title = textOf(last).slice(0, 60) || "New chat";
          await supabase.from("chat_threads").update(update).eq("id", threadId);
        }

        const tasks = await tasksContext(supabase);
        const instructions = `You are Compass, a friendly, sharp AI workplace assistant inside the "Smart Productivity AI Assistant" app. Help with productivity, time management, task planning, and research. Be concise, practical and use markdown (headings, bullet lists, bold) when helpful. Today is ${new Date().toUTCString()}.

The user's current tasks:
${tasks}`;

        const { result, runIdFetch } = createResponsesCall(
          request,
          await convertToModelMessages(messages),
          instructions,
        );

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: true,
            onFinish: async ({ responseMessage }) => {
              const { error } = await supabase.from("chat_messages").upsert(
                {
                  thread_id: threadId,
                  user_id: userId,
                  message_id: responseMessage.id,
                  role: "assistant",
                  parts: responseMessage.parts as unknown as Json,
                },
                { onConflict: "thread_id,message_id" },
              );
              if (error) console.error("save assistant message failed", error);
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
