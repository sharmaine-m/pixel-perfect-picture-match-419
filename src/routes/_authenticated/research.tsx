import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { AiMessages } from "@/components/ai-messages";
import { aiErrorMessage, authedTransport } from "@/lib/ai-transport";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Smart Productivity" },
      { name: "description", content: "Summarize articles and topics into key points, insights and recommendations." },
      { property: "og:title", content: "AI Research Assistant — Smart Productivity" },
      { property: "og:description", content: "Summaries, key points, insights and recommendations." },
    ],
  }),
  component: Research,
});

const examples = [
  "Explain the Pomodoro technique and when it works best",
  "Summarize the pros and cons of remote work for small teams",
  "What are the key ideas behind Getting Things Done?",
];

function Research() {
  const transport = useMemo(() => authedTransport("/api/assist", { mode: "research" }), []);
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    transport,
    onError: (e) => toast.error(aiErrorMessage(e)),
  });
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex h-[calc(100dvh-57px)] max-w-4xl flex-col p-4 md:h-dvh md:p-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold md:text-4xl">Research Assistant</h1>
          <p className="text-sm text-muted-foreground">Enter a topic or paste an article. Ask follow-ups anytime.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={busy}>
            <RotateCcw /> New research
          </Button>
        )}
      </div>

      <Conversation className="flex-1 rounded-2xl border bg-card">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState title="What do you want to understand?" description="Try one of these:">
              <div className="flex flex-col items-center gap-3 text-center">
                <h3 className="font-display text-xl font-semibold">What do you want to understand?</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {examples.map((e) => (
                    <Button key={e} variant="outline" size="sm" className="h-auto whitespace-normal py-2" onClick={() => sendMessage({ text: e })}>
                      {e}
                    </Button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            <AiMessages messages={messages} status={status} />
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        className="mt-4"
        onSubmit={({ text }) => {
          if (!text?.trim() || busy) return;
          sendMessage({ text });
        }}
      >
        <PromptInputTextarea autoFocus placeholder="Paste an article, or type a topic or question…" />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
