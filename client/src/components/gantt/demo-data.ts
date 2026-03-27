import { addDays, setHours, subDays } from "date-fns";
import type { Epic } from "@db/schema";
import type { JiraTask } from "@/types/jira";

export function createDemoGanttData(referenceDate = new Date()) {
  const anchor = setHours(referenceDate, 9);

  const epics: Epic[] = [
    {
      id: 9001,
      name: "Experience Refresh",
      description: "Improve the planner launch experience",
      startDate: subDays(anchor, 5),
      endDate: addDays(anchor, 8),
      status: "In Progress",
    },
    {
      id: 9002,
      name: "Release Readiness",
      description: "Tighten review, QA, and launch sequencing",
      startDate: subDays(anchor, 2),
      endDate: addDays(anchor, 11),
      status: "Blocked",
    },
  ];

  const tasks: JiraTask[] = [
    {
      id: 9101,
      epicId: 9001,
      name: "Moodboard pass",
      description: "Define the neumorphic system and spacing rules",
      status: "DONE",
      startDate: subDays(anchor, 5),
      endDate: subDays(anchor, 2),
      originalStartDate: subDays(anchor, 5),
      originalEndDate: subDays(anchor, 2),
      jiraId: "DEMO-101",
      dependencies: [],
      metadata: {},
    },
    {
      id: 9102,
      epicId: 9001,
      name: "Toolbar polish",
      description: "Balance controls, chips, and export affordance",
      status: "IN PROGRESS",
      startDate: subDays(anchor, 1),
      endDate: addDays(anchor, 3),
      originalStartDate: subDays(anchor, 1),
      originalEndDate: addDays(anchor, 3),
      jiraId: "DEMO-102",
      dependencies: [],
      metadata: {},
    },
    {
      id: 9103,
      epicId: 9001,
      name: "Timeline tune-up",
      description: "Adjust default zoom and label density",
      status: "TO DO",
      startDate: addDays(anchor, 1),
      endDate: addDays(anchor, 5),
      originalStartDate: addDays(anchor, 1),
      originalEndDate: addDays(anchor, 5),
      jiraId: "DEMO-103",
      dependencies: [],
      metadata: {},
    },
    {
      id: 9201,
      epicId: 9002,
      name: "CSV dry run",
      description: "Validate import mapping with sample export",
      status: "IN PROGRESS",
      startDate: subDays(anchor, 2),
      endDate: addDays(anchor, 2),
      originalStartDate: subDays(anchor, 2),
      originalEndDate: addDays(anchor, 2),
      jiraId: "DEMO-201",
      dependencies: [],
      metadata: {},
    },
    {
      id: 9202,
      epicId: 9002,
      name: "Launch review",
      description: "Hold release checkpoint with design and QA",
      status: "BLOCKED",
      startDate: addDays(anchor, 4),
      endDate: addDays(anchor, 8),
      originalStartDate: addDays(anchor, 4),
      originalEndDate: addDays(anchor, 8),
      jiraId: "DEMO-202",
      dependencies: [],
      metadata: {},
    },
  ];

  return { epics, tasks };
}
