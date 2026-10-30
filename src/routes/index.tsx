import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, BookOpenText, MessagesSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Productivity AI Assistant — plan, research, focus" },
      {
        name: "description",
        content: "One AI workspace to schedule your tasks, summarize research and chat with a workplace assistant.",
      },
      { property: "og:title", content: "Smart Productivity AI Assistant" },
      { property: "og:description", content: "Plan your day, research faster and get answers from your AI assistant." },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: CalendarCheck,
    title: "AI Task Planner",
    body: "Add tasks with priorities and deadlines, then let AI build your daily or weekly schedule.",
  },
  {
    icon: BookOpenText,
    title: "Research Assistant",
    body: "Paste an article or name a topic. Get a summary, key points, insights and recommendations.",
  },
  {
    icon: MessagesSquare,
    title: "Workplace Chatbot",
    body: "Ask follow-up questions about your work, your tasks, or how to manage your time better.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={36} height={36} className="size-9" />
          <span className="font-display text-lg font-semibold">Smart Productivity</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-24">
        <p className="mb-4 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
          AI-powered productivity
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">
          Plan the day. <span className="text-primary">Understand</span> the work. Get it done.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Smart Productivity AI Assistant brings your tasks, research and an AI workplace assistant together in one calm
          place.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Get started free <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-24 grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
