import type { Epic } from "@db/schema";
import type { JiraSettings, JiraTask } from "@/types/jira";

export interface TaskUpdateInput {
  name?: string;
  description?: string | null;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function syncWithJira(domain: string, apiToken: string, email: string) {
  const response = await fetch('/api/jira/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, apiToken, email })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sync with JIRA');
  }
  return response.json();
}

export async function fetchJiraEpics(): Promise<Epic[]> {
  const response = await fetch('/api/epics');
  if (!response.ok) {
    throw new Error('Failed to fetch epics');
  }
  return response.json();
}

export async function fetchJiraTasks(): Promise<JiraTask[]> {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  const tasks: JiraTask[] = await response.json();
  return tasks.map(task => ({
    ...task,
    jiraId: task.jiraId || '',
    metadata: task.metadata || {},
  }));
}

export async function updateTaskDates(
  taskId: number,
  startDate: Date,
  endDate: Date,
): Promise<{ success: boolean }> {
  return updateTask(taskId, { startDate, endDate });
}

export async function updateTask(
  taskId: number,
  data: TaskUpdateInput,
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to update task dates');
  }
  return response.json();
}

export async function fetchJiraSettings(): Promise<JiraSettings> {
  const response = await fetch('/api/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch JIRA settings');
  }
  return response.json();
}

export async function saveJiraSettings(
  settings: JiraSettings,
): Promise<{ success: boolean }> {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!response.ok) {
    throw new Error('Failed to save JIRA settings');
  }
  return response.json();
}
