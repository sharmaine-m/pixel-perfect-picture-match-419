import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/lib/ai/responses.server";
import { withLovableAiGatewayRunIdHeader } from "@/lib/ai/run-id.server";
import { getUserClient, json, tasksContext } from "@/lib/user-client.server";

const RESEARCH = `You are an expert research assistant. Given a topic, question, or pasted article/document, produce a clear structured markdown report with these sections:
## Summary
## Key Points (bullets)
## Insights
## Recommendations
## Further Questions to Explore
Explain complex ideas simply. Be accurate; if unsure, say so. Answer follow-up questions directly.`;

export const Route = createFileRoute("/api/assist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await getUserClient(request);
        if (!user) return json(401, "Please sign in again.");
        const body = (await request.json()) as { messages?: UIMessage[]; mode?: string };
        if (!Array.isArray(body.messages)) return json(400, "Invalid request");

        let instructions = RESEARCH;
        if (body.mode === "schedule") {
          const tasks = await tasksContext(user.supabase);
          instructions = `You are an expert planner. Today is ${new Date().toUTCString()}. Build a realistic, prioritized schedule from the user's tasks, considering deadlines and importance (high > medium > low), skipping tasks with status "done". Use markdown: a short "Top priorities" list, then the schedule as time blocks (for a daily plan) or day-by-day sections (for a weekly plan). Include breaks and end with 2-3 time-management tips.

Tasks:
${tasks}`;
        }

        const { result, runIdFetch } = createResponsesCall(
          request,
          await convertToModelMessages(body.messages),
          instructions,
        );
        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({ originalMessages: body.messages, sendReasoning: true }),
          runIdFetch,
        );
      },
    },
  },
});
