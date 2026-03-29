import { type Express } from "express";
import { addDays, setHours, subDays } from "date-fns";

type DemoEpic = {
  id: number;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
};

type DemoTask = {
  id: number;
  epicId: number | null;
  name: string;
  description: string | null;
  status: string;
  startDate: Date;
  endDate: Date;
  originalStartDate: Date;
  originalEndDate: Date;
  jiraId: string;
  dependencies: string[];
  metadata: Record<string, never>;
};

function createDemoGanttData(referenceDate = new Date()) {
  const anchor = setHours(referenceDate, 9);

  const epics: DemoEpic[] = [
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

  const tasks: DemoTask[] = [
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

const demoState = createDemoGanttData();

export function registerRoutes(app: Express) {
  app.get("/api/epics", (_req, res) => {
    res.json(demoState.epics);
  });

  app.get("/api/tasks", (_req, res) => {
    res.json(demoState.tasks);
  });

  app.get("/api/settings", (_req, res) => {
    res.json([]);
  });

  app.put("/api/settings/:id", (_req, res) => {
    res.json({ success: true, demoMode: true });
  });

  app.put("/api/epics/:id", (req, res) => {
    const epicId = Number(req.params.id);
    const epic = demoState.epics.find((candidate) => candidate.id === epicId);

    if (!epic) {
      return res.status(404).json({ error: "Epic not found" });
    }

    Object.assign(epic, req.body);
    res.json({ success: true, demoMode: true });
  });

  app.put("/api/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);
    const task = demoState.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (req.body.startDate) {
      task.startDate = new Date(req.body.startDate);
    }

    if (req.body.endDate) {
      task.endDate = new Date(req.body.endDate);
    }

    res.json({ success: true, demoMode: true });
  });

  app.post("/api/upload/csv", (_req, res) => {
    res.status(503).json({
      error: "CSV import is disabled in demo mode",
      details: "Set DATABASE_URL to enable persisted CSV imports.",
    });
  });
}
