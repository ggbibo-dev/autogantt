import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JiraTask } from "@/types/jira";

interface TaskEditDialogProps {
  task: JiraTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: {
    name: string;
    description: string;
    status: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

const TASK_STATUS_OPTIONS = ["TO DO", "IN PROGRESS", "BLOCKED", "DONE"];

function formatDateInput(value: Date | string) {
  return format(new Date(value), "yyyy-MM-dd");
}

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: TaskEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TO DO");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!task || !open) {
      return;
    }

    setName(task.name);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setStartDate(formatDateInput(task.startDate));
    setEndDate(formatDateInput(task.endDate));
    setError("");
  }, [open, task]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-surface max-w-xl rounded-[28px] border-white/60 bg-[rgba(244,247,252,0.96)] p-7">
        <DialogHeader className="space-y-2">
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Update copy, status, and timing without leaving the gantt view.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            const nextStart = new Date(`${startDate}T00:00:00`);
            const nextEnd = new Date(`${endDate}T12:00:00`);

            if (!name.trim()) {
              setError("Task title is required.");
              return;
            }

            if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) {
              setError("Choose valid start and end dates.");
              return;
            }

            if (nextEnd < nextStart) {
              setError("End date must be on or after start date.");
              return;
            }

            onSave({
              name: name.trim(),
              description: description.trim(),
              status,
              startDate: nextStart,
              endDate: nextEnd,
            });
            onOpenChange(false);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="task-name">Title</Label>
            <Input
              id="task-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="neo-inset border-white/60 bg-white/55"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="neo-inset min-h-[112px] border-white/60 bg-white/55"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="grid gap-2">
              <Label htmlFor="task-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  id="task-status"
                  className="neo-inset border-white/60 bg-white/55"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="task-start">Start</Label>
                <Input
                  id="task-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="neo-inset border-white/60 bg-white/55"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-end">End</Label>
                <Input
                  id="task-end"
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="neo-inset border-white/60 bg-white/55"
                />
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
