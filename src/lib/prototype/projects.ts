import { Area, Project, PrototypeState } from "./types";

/** Projects saved before areas were introduced belong to Do. */
export function projectArea(project: Project): Area { return project.area === "be" ? "be" : "do"; }
export function projectsInArea(projects: Project[], area: Area): Project[] { return projects.filter((project) => projectArea(project) === area); }

export const projectCategories = (area: Area) => area === "do"
  ? ["Work", "Learn", "Create", "Admin", "Other"]
  : ["Move", "Learn", "Reading", "Create", "Explore", "People", "Reflect", "Rest"];
export function activeProjectsInArea(projects: Project[], area: Area) {
  return projectsInArea(projects, area).filter(project => !project.completedAt);
}
export function projectCounts(projects: Project[], area: Area) {
  const all = projectsInArea(projects, area), completed = all.filter(p => !!p.completedAt).length;
  return { active: all.length - completed, completed, percent: all.length ? Math.round(completed / all.length * 100) : 0 };
}
export function setProjectCompleted(state: PrototypeState, id: string, completed: boolean, now: string): PrototypeState {
  return { ...state, projects: state.projects.map(p => p.id === id ? { ...p, completedAt: completed ? p.completedAt || now : undefined } : p) };
}
export function editProjectSessionNote(state: PrototypeState, projectId: string, sessionId: string, note: string): PrototypeState {
  if (note.length > 1000 || !state.sessions.some(s => s.id === sessionId && s.projectId === projectId)) return state;
  return { ...state, sessions: state.sessions.map(s => s.id === sessionId ? { ...s, note: note.trim() } : s),
    activities: state.activities.map(a => a.id === `session-${sessionId}` ? { ...a, note: note.trim() } : a) };
}
