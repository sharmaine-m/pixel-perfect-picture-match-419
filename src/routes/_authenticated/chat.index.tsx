import { createFileRoute, redirect } from "@tanstack/react-router";
import { createThread, threadsQuery } from "@/lib/threads";

export const Route = createFileRoute("/_authenticated/chat/")({
  beforeLoad: async ({ context }) => {
    const threads = await context.queryClient.fetchQuery(threadsQuery);
    const id = threads[0]?.id ?? (await createThread());
    if (!threads[0]) await context.queryClient.invalidateQueries({ queryKey: ["threads"] });
    throw redirect({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
  },
});
