import { ActiveTimer, PrototypeState, Task, TaskStatus } from "./types";
import { finishSession } from "./sessions";
import { dateKey } from "./seed";

export function taskStatus(task: Task): TaskStatus {
  return task.completed ? "done" : task.status === "in_progress" ? "in_progress" : "todo";
}
export function taskHistory(state: PrototypeState, taskId: string) {
  const sessions = state.sessions.filter((session) => session.taskId === taskId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || a.id.localeCompare(b.id));
  return { sessions, seconds: sessions.reduce((sum, session) => sum + session.durationSeconds, 0),
    days: new Set(sessions.map((session) => session.date)).size };
}
export function changeTaskStatus(state: PrototypeState, id: string, status: TaskStatus, timer: ActiveTimer | null, now: number, makeId: () => string): PrototypeState {
  const task = state.tasks.find((task) => task.id === id);
  if (!task || taskStatus(task) === status) return state;
  let next = state;
  if (status === "done" && timer?.taskId === id) {
    const seconds = timer.elapsed + (timer.runningSince !== null ? Math.max(0, Math.floor((now - timer.runningSince) / 1000)) : 0);
    next = finishSession(state, { ...timer, runningSince: null, endedAt: timer.endedAt || new Date(now).toISOString() }, seconds,
      { title: task.title, area: task.area, category: task.category, projectId: task.projectId, taskId: id, note: "" }, makeId);
  }
  const recordedAt = new Date(now).toISOString();
  return { ...next,
    tasks: next.tasks.map((task) => task.id === id ? { ...task, status, completed: status === "done" } : task),
    activities: [ ...next.activities.filter((activity) => activity.id !== `task-${id}`),
      ...(status === "done" ? [{ id: `task-${id}`, title: task.title, recordedAt, date: dateKey(new Date(now)),
        area: task.area, category: task.category, kind: "task" as const, minutes: 0, projectId: task.projectId, source: "manual" as const }] : []) ],
  };
}
// A session is the source of task totals; update its activity mirror in the same save.
export function editTaskSession(state: PrototypeState, sessionId: string, taskId: string, note: string): PrototypeState {
  const session = state.sessions.find((session) => session.id === sessionId);
  const task = state.tasks.find((task) => task.id === taskId);
  if (!session || !task || note.length > 1000) return state;
  return { ...state,
    sessions: state.sessions.map((item) => item.id === sessionId ? { ...item, taskId, projectId: task.projectId, area: task.area, category: task.category, note: note.trim() } : item),
    activities: state.activities.map((item) => item.id === `session-${sessionId}` ? { ...item, projectId: task.projectId, area: task.area, category: task.category, note: note.trim() } : item),
  };
}
