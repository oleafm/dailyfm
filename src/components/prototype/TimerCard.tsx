"use client";
import { RefObject } from "react";
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
import { ActiveTimer, Area, Task } from "@/lib/prototype/types";
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
  mode, onModeChange, countdownMinutes, onMinutesChange, soundEnabled, onSoundChange, onPreviewSound,
}: {
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
  const target = timer ? countdownTarget(timer) : mode === "countdown" ? (Number.isFinite(countdownMinutes) ? countdownMinutes * 60 : 0) : null;
  const displayed = target === null ? seconds : Math.max(0, target - (timer ? seconds : 0));
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
        {timer?.countdownCompleted ? "Time is up." : timer
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
          {(["stopwatch", "countdown"] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? "selected" : ""} onClick={() => onModeChange(value)}>{value === "stopwatch" ? "Stopwatch" : "Countdown"}</button>)}
        </div>
        {mode === "countdown" && <div className="countdown-settings">
          <div className="countdown-presets" role="group" aria-label="Countdown presets">{[5,15,25,45,60].map(minutes => <button key={minutes} type="button" aria-pressed={countdownMinutes === minutes} onClick={() => onMinutesChange(minutes)}>{minutes}m</button>)}</div>
          <div className="countdown-custom"><label>Minutes<input type="number" aria-label="Countdown minutes" min={1} max={1440} step={1} value={Number.isFinite(countdownMinutes) ? countdownMinutes : ""} onChange={event => onMinutesChange(event.target.value === "" ? NaN : Number(event.target.value))} /></label>
            <button type="button" className="countdown-sound" aria-pressed={soundEnabled} onClick={() => onSoundChange(!soundEnabled)}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}Sound {soundEnabled ? "on" : "off"}</button>
            {soundEnabled && <button type="button" className="countdown-preview" onClick={onPreviewSound}>Test sound</button>}
          </div>
        </div>}
      </div>}
      <div
        className="timer-clock"
        role="timer"
        aria-label={target === null ? `${seconds} seconds elapsed` : `${displayed} seconds remaining`}
      >
        <span ref={clockRef}>{clock(displayed)}</span>
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
          {mode === "countdown" ? "Start countdown" : "Begin a session"}{" "}
          <span>
            <ArrowUpRight size={16} />
          </span>
        </button>
      )}
      <div className="focus-bottom">
        <ArrowDown size={12} /> {timer?.countdownCompleted ? "Countdown complete. Save or reset your session." : target !== null ? "Stops at zero. Focused time excludes pauses." : active ? "Focus linked to this task." : projectName ? "Focus linked to this project." : "No target. Just intentional time."}
      </div>
      </div>
    </section>
  );
}
