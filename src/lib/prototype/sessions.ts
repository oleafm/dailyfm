import { ActiveTimer, Activity, Area, PrototypeState, TimerSession } from "./types";
import { dateKey } from "./seed";

export interface SessionDetails {
  title: string;
  area: Area;
  category: string;
  taskId?: string;
  createTask?: boolean;
  projectId?: string;
  newProjectName?: string;
  note: string;
  durationSeconds?: number;
}

export function parseFocusedDuration(value: string): number | null {
  const parts = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(value.trim());
  if (!parts) return null;
  const seconds = Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3]);
  return seconds > 0 ? seconds : null;
}
export function recordedSessionSeconds(timer: ActiveTimer): number {
  const elapsed = (Date.parse(timer.endedAt || new Date().toISOString()) - Date.parse(timer.startedAt)) / 1000;
  return Number.isFinite(elapsed) ? Math.max(1, Math.floor(elapsed)) : 0;
}

export function finishSession(state: PrototypeState, timer: ActiveTimer, seconds: number, details: SessionDetails, makeId: () => string): PrototypeState {
  const endedAt = timer.endedAt || new Date().toISOString();
  const date = dateKey(new Date(endedAt));
  const measuredSeconds = Math.max(1, Math.floor(seconds));
  const durationSeconds = details.durationSeconds ?? measuredSeconds;
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || (details.durationSeconds !== undefined && durationSeconds > recordedSessionSeconds({ ...timer, endedAt }))) throw new Error("Focused time must fit within the recorded session.");
  const adjustment = durationSeconds !== measuredSeconds ? { durationAdjusted: true, originalDurationSeconds: measuredSeconds } : {};
  const id = makeId();
  const title = details.title.trim() || "Focus session";
  const category = details.category.trim() || (details.area === "do" ? "Work" : "Rest");
  let projects = state.projects;
  let tasks = state.tasks;
  let projectId = projects.find((project) => project.id === details.projectId)?.id;
  if (details.newProjectName?.trim()) {
    projectId = makeId();
    projects = [...projects, { id: projectId, name: details.newProjectName.trim(), description: "", color: "sage", milestones: [] }];
  }
  let taskId = tasks.find((task) => task.id === details.taskId)?.id;
  if (details.createTask) {
    taskId = makeId();
    tasks = [...tasks, { id: taskId, title, area: details.area, category, projectId, completed: false, status: "in_progress" }];
  }
  if (taskId) tasks = tasks.map((task) => task.id === taskId && !task.completed ? { ...task, status: "in_progress" } : task);
  return {
    ...state, projects, tasks,
    sessions: [...state.sessions, { id, taskId, title, area: details.area, category, projectId, startedAt: timer.startedAt, endedAt, durationSeconds, ...adjustment, date, note: details.note.trim() }],
    activities: [...state.activities, { id: `session-${id}`, title, date, area: details.area, category, kind: "session", minutes: durationSeconds / 60, note: details.note.trim(), projectId, source: "timer", startedAt: timer.startedAt, endedAt, recordedAt: endedAt }],
  };
}

// Legacy records have a start but no trustworthy end. Never infer an end from
// focused duration: a pause may have occurred between the two timestamps.
export function chronologicalActivities(activities: Activity[], sessions: TimerSession[] = []): Activity[] {
  const history = new Map(sessions.map((session) => [`session-${session.id}`, session]));
  return activities.map((activity) => {
    const session = history.get(activity.id);
    return session ? { ...activity, startedAt: activity.startedAt || session.startedAt, endedAt: activity.endedAt || session.endedAt } : activity;
  }).sort((a, b) => {
    const byDay = a.date.localeCompare(b.date);
    if (byDay) return byDay;
    const time = (value: Activity) => {
      const timestamp = Date.parse(value.startedAt || value.recordedAt || "");
      return Number.isFinite(timestamp) ? timestamp : Infinity;
    };
    const left = time(a), right = time(b);
    return left === right ? 0 : left < right ? -1 : 1;
  });
}

export function displayTime(value: string): string {
  return new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
}
