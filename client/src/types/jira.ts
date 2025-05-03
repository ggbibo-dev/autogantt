export interface JiraSettings {
  domain: string;
  apiToken: string;
  email: string;
}

export interface JiraEpic {
  id: number;
  name: string;
  description: string | null;
  status: string;
  startDate: Date;
  endDate: Date;
  jiraId: string;
  metadata: any;
}

export interface JiraTask {
  id: number;
  name: string;
  description: string | null;
  status: string;
  startDate: Date;
  endDate: Date;
  epicId: number | null;
  jiraId: string;
  dependencies: any;
  metadata: any;
  originalStartDate: Date;
  originalEndDate: Date;
}
