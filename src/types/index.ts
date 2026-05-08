export interface Project {
  id: string;
  name: string;
  color: string;
  client: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  task_id: string | null;
  date: string;
  hours: number | null;
  notes: string | null;
  started_at: string | null;
  stopped_at: string | null;
  is_running: boolean;
  created_at: string;
}

export interface TimeEntryWithRelations extends TimeEntry {
  project?: Project;
  task?: Task;
}
