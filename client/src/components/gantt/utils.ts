import {
  addDays,
  addSeconds,
  differenceInSeconds,
  endOfDay,
  startOfDay,
  subDays,
} from "date-fns";
import type { Epic } from "@db/schema";
import type { JiraTask } from "@/types/jira";
import {
  GANTT_DEFAULT_RANGE_DAYS,
  GANTT_EXPORT_PADDING_DAYS,
  GANTT_GROUP_HEADER_HEIGHT,
  GANTT_MIN_HEIGHT,
  GANTT_ROW_HEIGHT,
} from "@/components/gantt/constants";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface GanttGroup {
  epic: Epic;
  tasks: JiraTask[];
}

function normalizeDateRange(start: Date, end: Date): DateRange {
  return {
    start: startOfDay(start),
    end: endOfDay(end),
  };
}

export function createDefaultDateRange(referenceDate = new Date()): DateRange {
  return normalizeDateRange(
    subDays(referenceDate, GANTT_DEFAULT_RANGE_DAYS),
    addDays(referenceDate, GANTT_DEFAULT_RANGE_DAYS),
  );
}

export function buildInitialTaskOrder(tasks: JiraTask[]): Record<number, number> {
  const tasksByEpic = new Map<number, JiraTask[]>();

  for (const task of tasks) {
    const epicId = task.epicId ?? 0;
    const epicTasks = tasksByEpic.get(epicId) ?? [];
    epicTasks.push(task);
    tasksByEpic.set(epicId, epicTasks);
  }

  const nextOrder: Record<number, number> = {};
  for (const epicTasks of Array.from(tasksByEpic.values())) {
    epicTasks.forEach((task: JiraTask, index: number) => {
      nextOrder[task.id] = index;
    });
  }

  return nextOrder;
}

export function getSortedTasks(
  tasks: JiraTask[],
  taskOrder: Record<number, number>,
  epicId: number,
) {
  return tasks
    .filter((task) => task.epicId === epicId)
    .sort((left, right) => (taskOrder[left.id] ?? 0) - (taskOrder[right.id] ?? 0));
}

export function groupTasksByEpic(
  epics: Epic[],
  tasks: JiraTask[],
  taskOrder: Record<number, number>,
): GanttGroup[] {
  return epics.map((epic) => ({
    epic,
    tasks: getSortedTasks(tasks, taskOrder, epic.id),
  }));
}

export function getGroupHeight(taskCount: number) {
  return GANTT_GROUP_HEADER_HEIGHT + taskCount * GANTT_ROW_HEIGHT;
}

export function getChartHeight(groups: GanttGroup[]) {
  const contentHeight = groups.reduce(
    (total, group) => total + getGroupHeight(group.tasks.length),
    0,
  );

  return Math.max(GANTT_MIN_HEIGHT, contentHeight);
}

export function getTimelinePercent(
  value: Date,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const totalDuration = Math.max(1, differenceInSeconds(rangeEnd, rangeStart));
  const clampedSeconds = Math.min(
    totalDuration,
    Math.max(0, differenceInSeconds(value, rangeStart)),
  );

  return (clampedSeconds / totalDuration) * 100;
}

export function getTaskDateBounds(tasks: JiraTask[]) {
  if (!tasks.length) {
    return null;
  }

  const [firstTask, ...remainingTasks] = tasks;
  let earliest = new Date(firstTask.startDate);
  let latest = new Date(firstTask.endDate);

  for (const task of remainingTasks) {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    if (taskStart < earliest) {
      earliest = taskStart;
    }

    if (taskEnd > latest) {
      latest = taskEnd;
    }
  }

  return { start: earliest, end: latest };
}

export function createExportDateRange(tasks: JiraTask[]): DateRange | null {
  const bounds = getTaskDateBounds(tasks);
  if (!bounds) {
    return null;
  }

  return normalizeDateRange(
    subDays(bounds.start, GANTT_EXPORT_PADDING_DAYS),
    addDays(bounds.end, GANTT_EXPORT_PADDING_DAYS),
  );
}

export function moveTaskWithinEpic(
  tasks: JiraTask[],
  taskOrder: Record<number, number>,
  taskId: number,
  epicId: number | null,
  newIndex: number,
) {
  const nextOrder = { ...taskOrder };
  const scopedTasks = tasks
    .filter((task) => task.epicId === epicId)
    .sort((left, right) => (taskOrder[left.id] ?? 0) - (taskOrder[right.id] ?? 0));

  const currentIndex = scopedTasks.findIndex((task) => task.id === taskId);
  const boundedIndex = Math.max(0, Math.min(newIndex, scopedTasks.length - 1));

  if (currentIndex < 0 || currentIndex === boundedIndex) {
    return nextOrder;
  }

  const reorderedTasks = [...scopedTasks];
  const [movedTask] = reorderedTasks.splice(currentIndex, 1);
  reorderedTasks.splice(boundedIndex, 0, movedTask);

  reorderedTasks.forEach((task, index) => {
    nextOrder[task.id] = index;
  });

  return nextOrder;
}

export function shiftDateRange(dateRange: DateRange, direction: 1 | -1, zoom: number) {
  const deltaDays = (GANTT_DEFAULT_RANGE_DAYS * direction) / zoom;

  return normalizeDateRange(
    addDays(dateRange.start, deltaDays),
    addDays(dateRange.end, deltaDays),
  );
}

export function zoomDateRange(
  dateRange: DateRange,
  nextZoom: number,
  baseDurationSeconds: number,
): DateRange {
  const currentDuration = differenceInSeconds(dateRange.end, dateRange.start);
  const center = addSeconds(dateRange.start, currentDuration / 2);
  const adjustedHalfDuration = baseDurationSeconds / nextZoom / 2;

  return normalizeDateRange(
    addSeconds(center, -adjustedHalfDuration),
    addSeconds(center, adjustedHalfDuration),
  );
}
