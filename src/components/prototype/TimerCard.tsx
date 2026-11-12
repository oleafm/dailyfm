"use client";
import { RefObject, useId } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { countdownTarget, TimerMode } from "@/lib/prototype/active-timer";
import { ActiveTimer, Area, Task, PomodoroSettings } from "@/lib/prototype/types";
export function clock(seconds: number) {
  return [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}
export default function TimerCard({
  tasks,
  projectName,
  area,
  timer,
  seconds,
  onStart,
  onPause,
  onStop,
  clockRef,
  pomodoroSettings, onPomodoroChange, remainingSeconds,
  mode, onModeChange, countdownMinutes, onMinutesChange, soundEnabled, onSoundChange, onPreviewSound,
}: {
  pomodoroSettings: PomodoroSettings; onPomodoroChange: (settings: PomodoroSettings) => void; remainingSeconds: number;
  mode: TimerMode; onModeChange: (mode: TimerMode) => void;
  countdownMinutes: number; onMinutesChange: (minutes: number) => void;
  soundEnabled: boolean; onSoundChange: (enabled: boolean) => void; onPreviewSound: () => void;
  tasks: Task[];
  projectName?: string;
  area: Area;
  timer: ActiveTimer | null;
  seconds: number;
  onStart: (id?: string) => void;
  onPause: () => void;
  onStop: () => void;
  clockRef: RefObject<HTMLSpanElement>;
}) {
  const cometGradient = useId();
  const target = timer?.mode === "pomodoro" && timer.pomodoro ? (timer.pomodoro.phase === "focus" ? timer.pomodoro.focusSeconds : timer.pomodoro.breakSeconds) : timer ? countdownTarget(timer) : mode === "pomodoro" ? pomodoroSettings.focusSeconds : mode === "countdown" ? (Number.isFinite(countdownMinutes) ? countdownMinutes * 60 : 0) : null;
  const displayed = timer?.mode === "pomodoro" ? remainingSeconds : target === null ? seconds : Math.max(0, target - (timer ? seconds : 0));
  const active = tasks.find((t) => t.id === timer?.taskId);
  return (
    <section
      className={`focus-card ${timer?.runningSince ? "timer-active" : ""}`}
    >
      <div className="focus-top">
        <span className="eyebrow">A LITTLE ROOM TO FOCUS</span>
        <span
          className={`status-dot ${timer?.runningSince ? "pulsing" : ""}`}
        />
      </div>
      <h2>
        {timer?.countdownCompleted ? timer.mode === "pomodoro" ? "Pomodoro complete." : "Time is up." : timer
          ? active?.title || projectName || "Focus in progress."
          : area === "do"
            ? "One thing at a time."
            : "Be here for a while."}
      </h2>
      <p>
        {timer
          ? timer.runningSince
            ? "Just this. Everything else can wait."
            : "Take a breath. Your time is safe."
          : area === "do"
            ? "Give something your undivided attention."
            : "Make a little space for yourself."}
      </p>
      {!timer && <div className="timer-setup">
        <div className="timer-mode-switch" role="group" aria-label="Timer mode">
          {(["stopwatch", "countdown", "pomodoro"] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? "selected" : ""} onClick={() => onModeChange(value)}>{value === "stopwatch" ? "Stopwatch" : value === "pomodoro" ? "Pomodoro" : "Countdown"}</button>)}
        </div>
        {mode === "pomodoro" && <div className="pomodoro-settings">
          {([{ key: "focusSeconds", label: "Focus minutes", max: 180, divisor: 60 }, { key: "breakSeconds", label: "Break minutes", max: 60, divisor: 60 }, { key: "totalSessions", label: "Sessions", max: 12, divisor: 1 }] as const).map(field => <label key={field.key}>{field.label}<input aria-label={field.label} type="number" min={1} max={field.max} step={1} value={Number.isFinite(pomodoroSettings[field.key]) ? pomodoroSettings[field.key] / field.divisor : ""} onChange={event => onPomodoroChange({ ...pomodoroSettings, [field.key]: event.target.value === "" ? NaN : Number(event.target.value) * field.divisor })} /></label>)}
        </div>}
        {mode === "countdown" && <div className="countdown-settings">
          <div className="countdown-presets" role="group" aria-label="Countdown presets">{[5,15,25,45,60].map(minutes => <button key={minutes} type="button" aria-pressed={countdownMinutes === minutes} onClick={() => onMinutesChange(minutes)}>{minutes}m</button>)}</div>
          <div className="countdown-custom"><label>Minutes<input type="number" aria-label="Countdown minutes" min={1} max={1440} step={1} value={Number.isFinite(countdownMinutes) ? countdownMinutes : ""} onChange={event => onMinutesChange(event.target.value === "" ? NaN : Number(event.target.value))} /></label>

          </div>
        </div>}
        {mode !== "stopwatch" && <div className="countdown-custom">            <button type="button" className="countdown-sound" aria-pressed={soundEnabled} onClick={() => onSoundChange(!soundEnabled)}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}Sound {soundEnabled ? "on" : "off"}</button>
            {soundEnabled && <button type="button" className="countdown-preview" onClick={onPreviewSound}>Test sound</button>}</div>}
      </div>}
      {timer?.mode === "pomodoro" && timer.pomodoro && <p className="pomodoro-phase" role="status">{timer.countdownCompleted ? "Ready to review" : timer.pomodoro.phase === "break" ? "Break" : "Focus"} · Session {timer.pomodoro.session} of {timer.pomodoro.totalSessions}</p>}
      <div
        className="timer-clock"
        role="timer"
        aria-label={target === null ? `${seconds} seconds elapsed` : `${displayed} seconds remaining`}
      >
        {timer && !timer.countdownCompleted && <svg className="timer-comet" viewBox="0 0 160 160" fill="none" aria-hidden="true" focusable="false">
          <defs><linearGradient id={cometGradient} x1="37.5" y1="13.4" x2="80" y2="1" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0" /><stop offset="1" stopColor="currentColor" />
          </linearGradient></defs>
          <path d="M37.5 13.4A79 79 0 0 1 80 1" stroke={`url(#${cometGradient})`} strokeWidth="3" strokeLinecap="round" />
          <circle cx="80" cy="1" r="3" fill="currentColor" />
        </svg>}
        <span className="timer-value" ref={clockRef}>{clock(displayed)}</span>
      </div>
      <div className="focus-controls">
      {timer ? (
        <div className="timer-actions">
          {!timer.countdownCompleted && <button
            className="focus-button"
            onClick={() =>
              timer.runningSince ? onPause() : onStart(timer.taskId)
            }
          >
            {timer.runningSince ? <Pause size={16} /> : <Play size={16} />}
            {timer.runningSince ? "Pause" : "Resume"}
          </button>}
          <button className="stop-button" onClick={onStop}>
            <Square size={14} />
            {timer.countdownCompleted ? "Review session" : "Finish"}
          </button>
        </div>
      ) : (
        <button
          className="focus-button"
          onClick={() => onStart()}
        >
          <Play size={16} fill="currentColor" />
          {mode === "pomodoro" ? "Start Pomodoro" : mode === "countdown" ? "Start countdown" : "Begin a session"}{" "}
          <span>
            <ArrowUpRight size={16} />
          </span>
        </button>
      )}
      <div className="focus-bottom">
        <ArrowDown size={12} /> {timer?.countdownCompleted ? timer.mode === "pomodoro" ? "Choose which focus logs to save." : "Countdown complete. Save or reset your session." : timer?.mode === "pomodoro" ? "Focus and breaks alternate automatically. Break time is not logged." : mode === "pomodoro" ? "Automatic focus and breaks. Save your chosen focus logs at the end." : target !== null ? "Stops at zero. Focused time excludes pauses." : active ? "Focus linked to this task." : projectName ? "Focus linked to this project." : "No target. Just intentional time."}
      </div>
      </div>
    </section>
  );
}
