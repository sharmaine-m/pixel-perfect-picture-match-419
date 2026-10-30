import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Plus, Wand2, ListChecks, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { AiMessages } from "@/components/ai-messages";
import { isSameDay, prioritize, tasksQuery, type Task } from "@/lib/tasks";
import { aiErrorMessage, authedTransport } from "@/lib/ai-transport";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Smart Productivity" },
      { name: "description", content: "Create, prioritize and schedule your tasks with AI." },
      { property: "og:title", content: "AI Task Planner — Smart Productivity" },
      { property: "og:description", content: "Create, prioritize and schedule your tasks with AI." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery),
  component: Planner,
});

function Planner() {
  const { data } = useSuspenseQuery(tasksQuery);
  const tasks = useMemo(() => prioritize(data), [data]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const transport = useMemo(() => authedTransport("/api/assist", { mode: "schedule" }), []);
  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onError: (e) => toast.error(aiErrorMessage(e)),
  });
  const busy = status === "submitted" || status === "streaming";

  function generate(kind: "daily" | "weekly") {
    setMessages([]);
    sendMessage({
      text:
        kind === "daily"
          ? "Create my personalized schedule for today with time blocks."
          : "Create my personalized weekly schedule for the next 7 days.",
    });
  }

  const visible = tasks.filter((t) => (filter === "all" ? true : filter === "done" ? t.status === "done" : t.status !== "done"));

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return { date: d, items: tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), d)) };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Task Planner</h1>
          <p className="text-muted-foreground">Sorted by deadline and priority. Let AI turn it into a plan.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus /> New task
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <Tabs defaultValue="list">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="list">
                <ListChecks /> List
              </TabsTrigger>
              <TabsTrigger value="week">
                <CalendarDays /> This week
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-1">
              {(["all", "todo", "done"] as const).map((f) => (
                <Button key={f} size="sm" variant={filter === f ? "secondary" : "ghost"} onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "todo" ? "Pending" : "Completed"}
                </Button>
              ))}
            </div>
          </div>
          <TabsContent value="list" className="mt-4 space-y-2">
            {visible.length ? (
              visible.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onEdit={(task) => {
                    setEditing(task);
                    setFormOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                No tasks here yet. Add your first task to get started.
              </div>
            )}
          </TabsContent>
          <TabsContent value="week" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {week.map(({ date, items }) => (
              <div key={date.toISOString()} className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold">
                  {date.toLocaleDateString(undefined, { weekday: "long" })}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </p>
                <div className="mt-2 space-y-2">
                  {items.length ? (
                    items.map((t) => <TaskItem key={t.id} task={t} compact />)
                  ) : (
                    <p className="text-xs text-muted-foreground">Free</p>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-6">
          <div className="flex items-center gap-2">
            <Wand2 className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Schedule</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Generate a prioritized plan from your tasks.</p>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" disabled={busy || !tasks.length} onClick={() => generate("daily")}>
              Daily plan
            </Button>
            <Button className="flex-1" variant="secondary" disabled={busy || !tasks.length} onClick={() => generate("weekly")}>
              Weekly plan
            </Button>
          </div>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <AiMessages messages={messages} status={status} hideUser />
          </div>
        </aside>
      </div>

      <TaskForm open={formOpen} onOpenChange={setFormOpen} task={editing} />
    </div>
  );
}
