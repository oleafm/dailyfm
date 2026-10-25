"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ActiveTimer, Area, Project, Task } from "@/lib/prototype/types";
import { displayTime, SessionDetails } from "@/lib/prototype/sessions";
import { clock } from "./TimerCard";

export default function SessionFinishForm({ timer, seconds, tasks, projects, initialArea, onSave, onDiscard }: {
  timer: ActiveTimer; seconds: number; tasks: Task[]; projects: Project[]; initialArea: Area;
  onSave: (details: SessionDetails) => void; onDiscard: () => void;
}) {
  const original = tasks.find((task) => task.id === timer.taskId);
  const [area, setArea] = useState<Area>(timer.area || original?.area || initialArea);
  const [taskId, setTaskId] = useState(original?.id || "");
  const [title, setTitle] = useState(original?.title || "Focus session");
  const [projectId, setProjectId] = useState(original?.projectId || "");
  const [category, setCategory] = useState(original?.category || (area === "do" ? "Work" : "Rest"));
  const categories = area === "do" ? ["Work", "Learn", "Create", "Admin", "Other"] : ["Move", "Learn", "Create", "Explore", "People", "Reflect", "Rest"];
  return (
    <form className="form" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSave({ title, area, category, taskId: taskId && taskId !== "__new" ? taskId : undefined, createTask: taskId === "__new", projectId: projectId !== "__new" ? projectId : undefined, newProjectName: projectId === "__new" ? String(form.get("projectName")) : undefined, note: String(form.get("note") || "") });
    }}>
      <div className="session-receipt">
        <span>{displayTime(timer.startedAt)}{timer.endedAt ? ` — ${displayTime(timer.endedAt)}` : ""}</span>
        <strong>{clock(seconds)}</strong>
        <p className="form-hint">Focused time excludes pauses. Add details now, or save without a task or project.</p>
      </div>
      <label>Session title<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} /></label>
      <label>Area<select aria-label="Area" value={area} onChange={(event) => {
        const next = event.target.value as Area;
        setArea(next); setTaskId(""); setCategory(next === "do" ? "Work" : "Rest");
      }}><option value="do">Do · work and intentions</option><option value="be">Be · time for life</option></select></label>
      <label>Task <span className="optional">optional</span><select aria-label="Task" value={taskId} onChange={(event) => {
        const next = event.target.value;
        setTaskId(next);
        const task = tasks.find((task) => task.id === next);
        if (task) { setTitle(task.title); setProjectId(task.projectId || ""); setCategory(task.category); }
      }}>
        <option value="">No task</option><option value="__new">Create a task from this session</option>
        {tasks.filter((task) => task.area === area && (!task.completed || task.id === original?.id)).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
      </select></label>
      <label>Project <span className="optional">optional</span><select aria-label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
        <option value="">No project</option><option value="__new">Create a project</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select></label>
      {projectId === "__new" && <label>New project name<input name="projectName" required maxLength={80} /></label>}
      <label>Category<select aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
        {Array.from(new Set([category, ...categories])).map((value) => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <label>A small piece of evidence <span className="optional">optional</span><textarea name="note" rows={3} maxLength={1000} placeholder="What changed during this session?" /></label>
      <button className="primary-button">Save this session <ArrowRight size={16} /></button>
      <button className="text-button discard-button" type="button" onClick={onDiscard}>Discard this session</button>
    </form>
  );
}
