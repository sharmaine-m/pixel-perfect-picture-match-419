import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { createThread, threadsQuery } from "@/lib/threads";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Smart Productivity" },
      { name: "description", content: "Chat with your AI workplace assistant about tasks, research and time management." },
      { property: "og:title", content: "AI Chat — Smart Productivity" },
      { property: "og:description", content: "Your AI workplace assistant." },
    ],
  }),
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: threads = [] } = useQuery(threadsQuery);
  const params = Route.useParams() as { threadId?: string };

  async function newThread() {
    try {
      const id = await createThread();
      await qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) navigate({ to: "/chat" });
  }

  return (
    <div className="flex h-[calc(100dvh-57px)] md:h-dvh">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-3 lg:flex">
        <Button onClick={newThread} className="mb-3">
          <Plus /> New chat
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads.map((t) => (
            <div key={t.id} className="group flex items-center rounded-lg hover:bg-muted">
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm"
                activeProps={{ className: "font-semibold text-primary" }}
              >
                <MessageSquare className="size-4 shrink-0" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button
                aria-label="Delete conversation"
                onClick={() => remove(t.id)}
                className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b p-2 lg:hidden">
          <select
            className="min-w-0 flex-1 rounded-md border bg-card px-2 py-1.5 text-sm"
            value={params.threadId ?? ""}
            onChange={(e) => navigate({ to: "/chat/$threadId", params: { threadId: e.target.value } })}
          >
            {threads.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={newThread}>
            <Plus /> New
          </Button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
