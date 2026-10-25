"use client";
import { RefObject } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Pause,
  Play,
  Square,
} from "lucide-react";
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
  area,
  timer,
  seconds,
  onStart,
  onPause,
  onStop,
  clockRef,
}: {
  tasks: Task[];
  area: Area;
  timer: ActiveTimer | null;
  seconds: number;
  onStart: (id?: string) => void;
  onPause: () => void;
  onStop: () => void;
  clockRef: RefObject<HTMLSpanElement>;
}) {
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
        {timer
          ? active?.title || "Focus in progress."
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
      <div
        className="timer-clock"
        role="timer"
        aria-label={`${seconds} seconds elapsed`}
      >
        <span ref={clockRef}>{clock(seconds)}</span>
      </div>
      {timer ? (
        <div className="timer-actions">
          <button
            className="focus-button"
            onClick={() =>
              timer.runningSince ? onPause() : onStart(timer.taskId)
            }
          >
            {timer.runningSince ? <Pause size={16} /> : <Play size={16} />}
            {timer.runningSince ? "Pause" : "Resume"}
          </button>
          <button className="stop-button" onClick={onStop}>
            <Square size={14} />
            Finish
          </button>
        </div>
      ) : (
        <button
          className="focus-button"
          onClick={() => onStart()}
        >
          <Play size={16} fill="currentColor" />
          Begin a session{" "}
          <span>
            <ArrowUpRight size={16} />
          </span>
        </button>
      )}
      <div className="focus-bottom">
        <ArrowDown size={12} /> No target. Just intentional time.
      </div>
    </section>
  );
}
