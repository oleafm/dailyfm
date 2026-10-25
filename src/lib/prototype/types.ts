export type Area = "do" | "be";
export type View = "today" | "projects" | "memories" | "insights";
export interface User {
  id: string;
  name: string;
}
export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  milestones: Milestone[];
}
export interface Task {
  id: string;
  title: string;
  area: Area;
  category: string;
  projectId?: string;
  completed: boolean;
}
export interface TimerSession {
  id: string;
  taskId?: string;
  title?: string;
  area?: Area;
  category?: string;
  projectId?: string;
  endedAt?: string;
  startedAt: string;
  durationSeconds: number;
  date: string;
  note: string;
}
export interface Activity {
  startedAt?: string;
  endedAt?: string;
  recordedAt?: string;
  id: string;
  title: string;
  date: string;
  area: Area;
  category: string;
  kind: "session" | "activity" | "task" | "reflection" | "challenge";
  minutes: number;
  note?: string;
  projectId?: string;
  distanceKm?: number;
  source: "manual" | "timer" | "sample";
}
export interface Reflection {
  id: string;
  date: string;
  text: string;
}
export interface DailyCheckIn {
  id: string;
  date: string;
  mood: number;
  movedForward: string;
  reflection: Reflection;
}
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: "Explore" | "Build" | "Stretch";
  target: number;
  month: string;
}
export interface ChallengeCompletion {
  id: string;
  challengeId: string;
  title: string;
  photo: string;
  photoIsSample: boolean;
  note: string;
  date: string;
  location: string;
  again: "Yes" | "Maybe" | "Absolutely not";
}
export interface WeeklyInsight {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
}
export interface PrototypeState {
  version: 1;
  user: User;
  tasks: Task[];
  projects: Project[];
  activities: Activity[];
  sessions: TimerSession[];
  checkIns: DailyCheckIn[];
  challenges: Challenge[];
  completions: ChallengeCompletion[];
}
export interface ActiveTimer {
  taskId?: string;
  area?: Area;
  endedAt?: string;
  startedAt: string;
  elapsed: number;
  runningSince: number | null;
}
