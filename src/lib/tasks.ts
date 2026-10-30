import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in_progress" | "done";

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data;
  },
});

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

/** Sort: unfinished first, then nearest deadline, then highest priority. */
export function prioritize(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const da = a.status === "done" ? 1 : 0;
    const db = b.status === "done" ? 1 : 0;
    if (da !== db) return da - db;
    const ta = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const tb = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    if (ta !== tb) return ta - tb;
    return (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
  });
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Tasks not done whose deadline falls within the next `hours` (overdue included). */
export function dueSoon(tasks: Task[], hours: number, now = new Date()) {
  const limit = now.getTime() + hours * 3600_000;
  return tasks.filter((t) => t.status !== "done" && t.deadline && new Date(t.deadline).getTime() <= limit);
}

export function completionRate(tasks: Task[]) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100);
}
