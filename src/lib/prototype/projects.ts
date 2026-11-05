import { Area, Project } from "./types";

/** Projects saved before areas were introduced belong to Do. */
export function projectArea(project: Project): Area { return project.area === "be" ? "be" : "do"; }
export function projectsInArea(projects: Project[], area: Area): Project[] { return projects.filter((project) => projectArea(project) === area); }
