import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { AiMessages } from "@/components/ai-messages";
import { aiErrorMessage, authedTransport } from "@/lib/ai-transport";
import { threadMessagesQuery } from "@/lib/threads";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(threadMessagesQuery(params.threadId)),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { data } = useSuspenseQuery(threadMessagesQuery(threadId));
  return <ChatWindow key={threadId} threadId={threadId} initial={data} />;
}

const starters = [
  "What should I focus on first today?",
  "Give me 5 tips to beat procrastination",
  "Help me break a big project into steps",
];

function ChatWindow({ threadId, initial }: { threadId: string; initial: UIMessage[] }) {
  const qc = useQueryClient();
  const transport = useMemo(() => authedTransport("/api/chat", { threadId }), [threadId]);
  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (e) => toast.error(aiErrorMessage(e)),
    onFinish: ({ messages: all }) => {
      qc.setQueryData(threadMessagesQuery(threadId).queryKey, all);
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col p-4 md:p-6">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="flex flex-col items-center gap-3 text-center">
                <img src={logo} alt="Compass" width={56} height={56} className="size-14" />
                <h3 className="font-display text-2xl font-semibold">Hi, I'm Compass</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Your workplace assistant. I know your tasks and can help you plan, prioritize and research.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {starters.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => sendMessage({ text: s })}>
                      {s}
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
        className="mt-3"
        onSubmit={({ text }) => {
          if (!text?.trim() || busy) return;
          sendMessage({ text });
        }}
      >
        <PromptInputTextarea autoFocus placeholder="Ask Compass anything…" />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
