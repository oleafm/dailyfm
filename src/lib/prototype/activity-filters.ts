import { Activity, Area, Project } from "./types";
import { projectCategories, projectsInArea } from "./projects";
export interface ActivityFilters { area: Area; projectId: string; category: string }
export function activityFilterOptions(activities: Activity[], projects: Project[], area: Area) {
  const areaProjects = projectsInArea(projects, area);
  const categories = Array.from(new Set([
    ...projectCategories(area),
    ...areaProjects.map(project => project.category || ""),
    ...activities.filter(activity => activity.area === area).map(activity => activity.category),
  ].filter(Boolean))).sort((a,b) => a.localeCompare(b));
  return { projects: areaProjects, categories };
}
export function filterActivityHistory(activities: Activity[], filters: ActivityFilters) {
  return activities.filter(activity => activity.area === filters.area &&
    (!filters.projectId || activity.projectId === filters.projectId) &&
    (!filters.category || activity.category === filters.category));
}
