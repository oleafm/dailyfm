import { ActiveTimer } from "./types";
import { advancePomodoro, pomodoroFocusSeconds, pomodoroPhaseElapsed, pomodoroTarget, stopPomodoro } from "./pomodoro";
export type TimerMode = "stopwatch" | "countdown" | "pomodoro";
export function countdownTarget(timer: ActiveTimer): number | null {
  return timer.mode === "countdown" && Number.isInteger(timer.targetSeconds) && timer.targetSeconds! >= 60 && timer.targetSeconds! <= 86400 ? timer.targetSeconds! : null;
}
export function timerElapsed(timer: ActiveTimer, now: number): number {
  if (timer.mode === "pomodoro" && timer.pomodoro) return pomodoroFocusSeconds(timer, now);
  const elapsed = Math.max(0, timer.elapsed) + (timer.runningSince !== null ? Math.max(0, Math.floor((now - timer.runningSince) / 1000)) : 0);
  return Math.min(countdownTarget(timer) ?? Infinity, elapsed);
}
export function timerDisplay(timer: ActiveTimer, now: number): number {
  if (timer.mode === "pomodoro" && timer.pomodoro) {
    const current = advancePomodoro(timer, now);
    return current.countdownCompleted ? 0 : Math.max(0, pomodoroTarget(current) - pomodoroPhaseElapsed(current, now));
  }
  const elapsed = timerElapsed(timer, now);
  const target = countdownTarget(timer);
  return target === null ? elapsed : Math.max(0, target - elapsed);
}
export function finishTimer(timer: ActiveTimer, now: number): ActiveTimer {
  if (timer.mode === "pomodoro" && timer.pomodoro) return stopPomodoro(timer, now);
  const elapsed = timerElapsed(timer, now), target = countdownTarget(timer);
  const complete = target !== null && elapsed >= target;
  const at = complete && timer.runningSince !== null
    ? timer.runningSince + Math.max(0, target - timer.elapsed) * 1000 : now;
  return { ...timer, elapsed, runningSince: null, endedAt: timer.endedAt || new Date(at).toISOString(), countdownCompleted: complete || undefined };
}
