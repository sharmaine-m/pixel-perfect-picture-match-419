import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/tasks";

const priorityClass: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-highlight/25 text-highlight-foreground",
  low: "bg-secondary text-secondary-foreground",
};

export function formatDeadline(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function TaskItem({ task, onEdit, compact }: { task: Task; onEdit?: (t: Task) => void; compact?: boolean }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: async (patch: Partial<Task>) => {
      const { error } = await supabase
        .from("tasks")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
  });

  const done = task.status === "done";
  const overdue = !done && task.deadline && new Date(task.deadline) < new Date();

  return (
    <div className={cn("rounded-xl border bg-card p-4 transition-colors", done && "opacity-60")}>
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={done}
          aria-label="Mark complete"
          onCheckedChange={(c) => update.mutate(c ? { status: "done", progress: 100 } : { status: "todo", progress: 0 })}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-semibold", done && "line-through")}>{task.title}</span>
            <Badge variant="outline" className={cn("border-transparent capitalize", priorityClass[task.priority])}>
              {task.priority}
            </Badge>
          </div>
          {!compact && task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
          {task.deadline && (
            <p className={cn("mt-1 flex items-center gap-1 text-xs text-muted-foreground", overdue && "text-destructive")}>
              <Clock className="size-3" /> {overdue ? "Overdue · " : ""}
              {formatDeadline(task.deadline)}
            </p>
          )}
          {!compact && (
            <div className="mt-3 flex items-center gap-3">
              <Slider
                value={[task.progress]}
                max={100}
                step={10}
                className="max-w-56"
                aria-label="Progress"
                onValueCommit={([v]) =>
                  update.mutate({ progress: v, status: v === 100 ? "done" : v > 0 ? "in_progress" : "todo" })
                }
              />
              <span className="w-10 text-xs font-medium tabular-nums text-muted-foreground">{task.progress}%</span>
            </div>
          )}
        </div>
        {onEdit && (
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" aria-label="Edit task" onClick={() => onEdit(task)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete task" onClick={() => remove.mutate()}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
