import { JiraSettings } from "../types/jira";

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

export async function fetchJiraEpics(): Promise<any> { //Added type any due to the lack of definition for JiraEpic in the provided snippet.  Should be replaced with correct type.
  const response = await fetch('/api/epics');
  if (!response.ok) {
    throw new Error('Failed to fetch epics');
  }
  return response.json();
}

export async function fetchJiraTasks(): Promise<Task[]> {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  const tasks: Task[] = await response.json();
  // Map DB tasks to include JiraTask properties
  return tasks.map(task => ({
    ...task,
    jiraId: '', // Default empty string for non-JIRA tasks
    metadata: {}, // Default empty object for non-JIRA tasks
  })) as unknown as Task[];
}

export async function updateTaskDates(taskId: number, startDate: Date, endDate: Date): Promise<any> { //Added type any due to the lack of return type definition.  Should be replaced with correct type.
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate })
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

export async function saveJiraSettings(settings: JiraSettings): Promise<any> { //Added type any due to the lack of return type definition. Should be replaced with correct type.
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