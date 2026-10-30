import type { UIMessage } from "ai";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";

export function AiMessages({
  messages,
  status,
  hideUser,
}: {
  messages: UIMessage[];
  status: string;
  hideUser?: boolean;
}) {
  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !last.parts.some((p) => p.type === "text" && p.text));
  return (
    <>
      {messages.map((m) =>
        hideUser && m.role === "user" ? null : (
          <Message key={m.id} from={m.role}>
            <MessageContent>
              {m.parts.map((p, i) =>
                p.type === "text" ? (
                  m.role === "user" ? (
                    <p key={i} className="whitespace-pre-wrap">{p.text}</p>
                  ) : (
                    <MessageResponse key={i}>{p.text}</MessageResponse>
                  )
                ) : null,
              )}
            </MessageContent>
          </Message>
        ),
      )}
      {waiting && (
        <Message from="assistant">
          <MessageContent>
            <Shimmer>Thinking...</Shimmer>
          </MessageContent>
        </Message>
      )}
    </>
  );
}
