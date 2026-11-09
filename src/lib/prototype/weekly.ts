import { Activity, Area, PrototypeState } from "./types";
import { projectArea } from "./projects";

/** Seven local calendar dates, including today. Session/activity pairs count once. */
export function weeklySummary(state: PrototypeState, from: string, to: string, area?: Area) {
  const inRange = (date: string) => date >= from && date <= to;
  const projectAreas = new Map(state.projects.map(project => [project.id, projectArea(project)]));
  const taskAreas = new Map(state.tasks.map(task => [task.id, task.area]));
  const sessions = new Map(state.sessions.map((session) => [`session-${session.id}`, session]));
  const recorded = new Set(state.activities.map((activity) => activity.id));
  const activities: Activity[] = state.activities.filter((activity) => activity.source !== "sample").map((activity) => ({
    ...activity,
    projectId: activity.projectId || sessions.get(activity.id)?.projectId,
  }));
  // Older records may contain a saved timer session without its mirrored activity.
  for (const session of state.sessions) {
    if (!recorded.has(`session-${session.id}`)) activities.push({
      id: `session-${session.id}`, title: session.title || "Focus session", date: session.date,
      area: session.area || taskAreas.get(session.taskId || "") || projectAreas.get(session.projectId || "") || "do", category: session.category || "Work", kind: "session",
      minutes: session.durationSeconds / 60, projectId: session.projectId,
      source: "timer", startedAt: session.startedAt, endedAt: session.endedAt,
    });
  }
  const recent = activities.filter((activity) => inRange(activity.date) && (!area || activity.area === area));
  const projects = state.projects.filter(project => !area || projectArea(project) === area).map((project) => {
    const work = recent.filter((activity) => activity.projectId === project.id);
    return { project, count: work.length, days: new Set(work.map((activity) => activity.date)).size,
      minutes: work.reduce((sum, activity) => sum + activity.minutes, 0) };
  }).filter((project) => project.count > 0)
    .sort((a, b) => b.minutes - a.minutes || b.count - a.count || a.project.id.localeCompare(b.project.id));
  return { recent, activeDays: new Set(recent.map((activity) => activity.date)).size,
    checkInDays: new Set(state.checkIns.filter((entry) => inRange(entry.date)).map((entry) => entry.date)).size,
    project: projects[0] };
}
