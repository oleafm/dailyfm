"use client";

import { useState } from "react";
import { Play, Plus } from "lucide-react";
import { Area, Project, Task } from "@/lib/prototype/types";

export default function FocusPicker({
  tasks,
  projects,
  area,
  initialTask,
  onStart,
  onNewTask,
}: {
  tasks: Task[];
  projects: Project[];
  area: Area;
  initialTask?: string;
  onStart: (id: string) => void;
  onNewTask: () => void;
}) {
  const available = tasks.filter((task) => !task.completed);
  const [selected, setSelected] = useState(
    available.find((task) => task.id === initialTask)?.id ||
      available.find((task) => task.area === area)?.id || available[0]?.id || "",
  );
  return (
    <form
      className="form focus-picker"
      onSubmit={(event) => {
        event.preventDefault();
        if (available.some((task) => task.id === selected)) onStart(selected);
      }}
    >
      <p className="muted">Choose one thing to give your attention to. Stay right where you are.</p>
      {available.length ? (
        <label>
          What will you focus on?
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {(["do", "be"] as const).map((taskArea) => {
              const group = available.filter((task) => task.area === taskArea);
              return group.length ? (
                <optgroup key={taskArea} label={taskArea === "do" ? "Do · work and intentions" : "Be · time for life"}>
                  {group.map((task) => {
                    const project = projects.find((project) => project.id === task.projectId);
                    return <option key={task.id} value={task.id}>{task.title}{project ? ` · ${project.name}` : ""}</option>;
                  })}
                </optgroup>
              ) : null;
            })}
          </select>
        </label>
      ) : (
        <p className="focus-picker-empty">A little room for something new. Create a task to begin your first session.</p>
      )}
      <button className="text-button" type="button" onClick={onNewTask}>
        <Plus size={16} /> Create a task
      </button>
      <button className="primary-button" type="submit" disabled={!available.some((task) => task.id === selected)}>
        <Play size={16} fill="currentColor" /> Start focus
      </button>
    </form>
  );
}
