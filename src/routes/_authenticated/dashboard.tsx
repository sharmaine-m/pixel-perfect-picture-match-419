import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarCheck, BookOpenText, MessagesSquare, CheckCircle2, Circle, AlarmClock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TaskItem } from "@/components/task-item";
import { completionRate, dueSoon, isSameDay, prioritize, tasksQuery } from "@/lib/tasks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Productivity AI Assistant" },
      { name: "description", content: "Your tasks, deadlines and progress at a glance." },
      { property: "og:title", content: "Dashboard — Smart Productivity AI Assistant" },
      { property: "og:description", content: "Your tasks, deadlines and progress at a glance." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tasksQuery),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const now = new Date();
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? user.email?.split("@")[0];
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const today = prioritize(tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), now)));
  const upcoming = prioritize(dueSoon(tasks, 24 * 7)).filter((t) => !today.includes(t)).slice(0, 5);
  const done = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.length - done;
  const rate = completionRate(tasks);

  const quick = [
    { to: "/planner", icon: CalendarCheck, title: "Plan my day", body: "Build an AI schedule from your tasks" },
    { to: "/research", icon: BookOpenText, title: "Research a topic", body: "Summaries, insights & key points" },
    { to: "/chat", icon: MessagesSquare, title: "Ask the assistant", body: "Chat about work and time management" },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <div className="rounded-3xl bg-sidebar bg-hero p-8 text-sidebar-foreground md:p-10">
        <p className="text-sm text-sidebar-foreground/70">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-1 text-4xl font-semibold md:text-5xl">
          {greeting}, {name}.
        </h1>
        <p className="mt-2 text-sidebar-foreground/70">
          {pending ? `You have ${pending} pending task${pending > 1 ? "s" : ""}. Let's make progress.` : "All clear — add a task to get started."}
        </p>
        <div className="mt-6 max-w-md">
          <div className="mb-2 flex justify-between text-sm">
            <span>Overall completion</span>
            <span className="font-semibold">{rate}%</span>
          </div>
          <Progress value={rate} className="h-2 bg-sidebar-accent" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={CheckCircle2} label="Completed" value={done} />
        <Stat icon={Circle} label="Pending" value={pending} />
        <Stat icon={AlarmClock} label="Due in 24h" value={dueSoon(tasks, 24).length} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className="group rounded-2xl border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
            <q.icon className="size-5 text-primary" />
            <h3 className="mt-3 text-lg font-semibold">{q.title}</h3>
            <p className="text-sm text-muted-foreground">{q.body}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">Today</h2>
          <div className="space-y-2">
            {today.length ? today.map((t) => <TaskItem key={t.id} task={t} compact />) : <Empty text="Nothing due today." />}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-semibold">Upcoming deadlines</h2>
          <div className="space-y-2">
            {upcoming.length ? upcoming.map((t) => <TaskItem key={t.id} task={t} compact />) : <Empty text="No deadlines this week." />}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Circle; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {text}{" "}
      <Link to="/planner" className="font-semibold text-primary">
        Add a task
      </Link>
    </div>
  );
}
