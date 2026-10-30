import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, CalendarCheck, BookOpenText, MessagesSquare, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { dueSoon, tasksQuery } from "@/lib/tasks";
import logo from "@/assets/logo.png";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Task Planner", icon: CalendarCheck },
  { to: "/research", label: "Research", icon: BookOpenText },
  { to: "/chat", label: "AI Chat", icon: MessagesSquare },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}
        >
          <n.icon className="size-4" />
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <img src={logo} alt="" width={32} height={32} className="size-8 rounded-md bg-sidebar-foreground p-0.5" />
      <span className="font-display text-base font-semibold leading-tight text-sidebar-foreground">
        Smart Productivity
      </span>
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: tasks } = useQuery(tasksQuery);
  const reminded = useRef(false);

  useEffect(() => {
    if (!tasks || reminded.current) return;
    reminded.current = true;
    const soon = dueSoon(tasks, 24);
    if (soon.length) {
      toast.warning(`${soon.length} task${soon.length > 1 ? "s" : ""} due within 24 hours`, {
        description: soon.slice(0, 3).map((t) => t.title).join(", "),
      });
    }
  }, [tasks]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const SignOut = (
    <Button
      variant="ghost"
      onClick={signOut}
      className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <LogOut className="size-4" /> Sign out
    </Button>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-sidebar p-4 md:flex">
        <div className="space-y-8">
          <Brand />
          <NavLinks />
        </div>
        {SignOut}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
          <Brand />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col justify-between border-none bg-sidebar p-4">
              <div className="space-y-8 pt-6">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Brand />
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              {SignOut}
            </SheetContent>
          </Sheet>
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
