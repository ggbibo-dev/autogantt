import {
  GANTT_GROUP_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
} from "@/components/gantt/constants";
import { GanttGroupHeader } from "@/components/gantt/GanttGroupHeader";
import { GanttTaskListItem } from "@/components/gantt/GanttTaskListItem";
import { getGroupHeight, type GanttGroup } from "@/components/gantt/utils";

interface GanttTaskListProps {
  groups: GanttGroup[];
}

export function GanttTaskList({ groups }: GanttTaskListProps) {
  return (
    <div className="relative">
      {groups.map((group) => (
        <div
          key={group.epic.id}
          className="relative mb-4 rounded-[24px] p-3 last:mb-0"
          style={{ minHeight: getGroupHeight(group.tasks.length) }}
        >
          <div
            className="absolute inset-x-0 top-0 flex items-center"
            style={{ height: GANTT_GROUP_HEADER_HEIGHT }}
          >
            <GanttGroupHeader title={group.epic.name} />
          </div>
          {group.tasks.map((task, index) => (
            <GanttTaskListItem
              key={task.id}
              task={task}
              top={GANTT_GROUP_HEADER_HEIGHT + index * GANTT_ROW_HEIGHT}
              height={GANTT_ROW_HEIGHT}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
