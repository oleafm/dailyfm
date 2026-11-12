import { ActiveTimer, PomodoroLog, PomodoroSettings, PrototypeState } from "./types";
import { finishSession, SessionDetails } from "./sessions";
export function validPomodoroSettings(value: PomodoroSettings) {
  return Number.isInteger(value.focusSeconds) && value.focusSeconds >= 60 && value.focusSeconds % 60 === 0 && value.focusSeconds <= 10800 &&
    Number.isInteger(value.breakSeconds) && value.breakSeconds >= 60 && value.breakSeconds % 60 === 0 && value.breakSeconds <= 3600 &&
    Number.isInteger(value.totalSessions) && value.totalSessions >= 1 && value.totalSessions <= 12;
}
export function pomodoroPhaseElapsed(timer: ActiveTimer, now: number): number {
  return Math.max(0, timer.elapsed) + (timer.runningSince === null ? 0 : Math.max(0, Math.floor((now - timer.runningSince) / 1000)));
}
export function pomodoroTarget(timer: ActiveTimer) {
  const p = timer.pomodoro!;
  return p.phase === "focus" ? p.focusSeconds : p.breakSeconds;
}
function phaseLog(timer: ActiveTimer, duration: number, endedAt: string, completed: boolean): PomodoroLog {
  const p = timer.pomodoro!;
  return { id: `${timer.startedAt}:${p.session}`, session: p.session, startedAt: p.phaseStartedAt, endedAt, durationSeconds: duration, completed };
}
/** Catch up by timestamps, even after throttling or reload. Never add a final break. */
export function advancePomodoro(timer: ActiveTimer, now: number): ActiveTimer {
  if (timer.mode !== "pomodoro" || !timer.pomodoro || !validPomodoroSettings(timer.pomodoro) || timer.runningSince === null || timer.countdownCompleted) return timer;
  let next = timer;
  for (let i = 0; i < 24; i++) {
    const p = next.pomodoro!, target = pomodoroTarget(next);
    if (pomodoroPhaseElapsed(next, now) < target) return next;
    const end = next.runningSince! + Math.max(0, target - next.elapsed) * 1000;
    const endedAt = new Date(end).toISOString();
    const logs = p.phase === "focus" ? [...p.logs, phaseLog(next, target, endedAt, true)] : p.logs;
    if (p.phase === "focus" && p.session === p.totalSessions) return { ...next, elapsed: 0, runningSince: null, endedAt, countdownCompleted: true, pomodoro: { ...p, logs } };
    next = { ...next, elapsed: 0, runningSince: end, pomodoro: { ...p, logs, phase: p.phase === "focus" ? "break" : "focus", session: p.phase === "break" ? p.session + 1 : p.session, phaseStartedAt: endedAt } };
  }
  return next;
}
export function pomodoroFocusSeconds(timer: ActiveTimer, now: number): number {
  const next = advancePomodoro(timer, now), p = next.pomodoro!;
  return p.logs.reduce((sum, log) => sum + log.durationSeconds, 0) + (!next.countdownCompleted && p.phase === "focus" ? Math.min(p.focusSeconds, pomodoroPhaseElapsed(next, now)) : 0);
}
export function stopPomodoro(timer: ActiveTimer, now: number): ActiveTimer {
  const next = advancePomodoro(timer, now);
  if (next.countdownCompleted) return next;
  const p = next.pomodoro!, duration = Math.min(p.focusSeconds, pomodoroPhaseElapsed(next, now));
  const endedAt = new Date(now).toISOString();
  const logs = p.phase === "focus" && duration > 0 ? [...p.logs, phaseLog(next, duration, endedAt, false)] : p.logs;
  return { ...next, elapsed: 0, runningSince: null, endedAt, countdownCompleted: true, pomodoro: { ...p, logs } };
}
/** All selected logs and any newly-created assignment are saved in one workspace update. */
export function savePomodoroLogs(state: PrototypeState, timer: ActiveTimer, details: SessionDetails, makeId: () => string): PrototypeState {
  if (timer.mode !== "pomodoro" || !timer.pomodoro || !timer.countdownCompleted) throw new Error("Finish the Pomodoro before saving.");
  const selection = details.pomodoroLogs;
  if (!selection?.length || new Set(selection.map(log => log.id)).size !== selection.length) throw new Error("Select at least one focus log.");
  const logs = selection.map(selected => {
    const log = timer.pomodoro!.logs.find(log => log.id === selected.id);
    if (!log || !Number.isInteger(selected.durationSeconds) || selected.durationSeconds < 1 || selected.durationSeconds > log.durationSeconds) throw new Error("Choose valid focus logs and durations.");
    return { ...log, savedSeconds: selected.durationSeconds };
  }).sort((a,b) => a.session - b.session);
  let next = state, assignment = details;
  for (const log of logs) {
    next = finishSession(next, { ...timer, mode: "stopwatch", pomodoro: undefined, startedAt: log.startedAt, endedAt: log.endedAt, elapsed: log.durationSeconds, runningSince: null }, log.durationSeconds, { ...assignment, durationSeconds: log.savedSeconds }, makeId);
    const saved = next.sessions[next.sessions.length - 1];
    assignment = { ...assignment, projectId: saved.projectId, taskId: saved.taskId, newProjectName: undefined, createTask: false };
  }
  return next;
}
