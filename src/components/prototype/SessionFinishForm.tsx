"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Pencil, RotateCcw, Plus } from "lucide-react";
import { ActiveTimer, Area, Project, Task } from "@/lib/prototype/types";
import { displayTime, parseFocusedDuration, recordedSessionSeconds, SessionDetails } from "@/lib/prototype/sessions";
import { clock } from "./TimerCard";
import AreaToggle from "./AreaToggle";
import { projectArea, projectsInArea } from "@/lib/prototype/projects";

export default function SessionFinishForm({ timer, seconds, tasks, projects, initialArea, onSave, onReset }: {
  timer: ActiveTimer; seconds: number; tasks: Task[]; projects: Project[]; initialArea: Area;
  onSave: (details: SessionDetails) => void; onReset: () => void;
}) {
  const original = tasks.find((task) => task.id === timer.taskId);
  const originalProject = projects.find((project) => project.id === (original?.projectId || timer.projectId));
  const [area, setArea] = useState<Area>(original?.area || (originalProject && projectArea(originalProject)) || initialArea);
  const [taskId, setTaskId] = useState(original?.id || "");
  const [title, setTitle] = useState(original?.title || originalProject?.name || "Focus session");
  const [projectId, setProjectId] = useState(originalProject && projectArea(originalProject) === area ? originalProject.id : "");
  const [category, setCategory] = useState(original?.category || (area === "do" ? "Work" : "Rest"));
  const [note, setNote] = useState("");
  const [projectName, setProjectName] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [durationText, setDurationText] = useState(clock(Math.max(1, seconds)));
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState("");
  const timeInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editingTime) { timeInput.current?.focus(); timeInput.current?.select(); } }, [editingTime]);
  const categories = area === "do" ? ["Work", "Learn", "Create", "Admin", "Other"] : ["Move", "Learn", "Reading", "Create", "Explore", "People", "Reflect", "Rest"];
  const availableProjects = projectsInArea(projects, area);
  const hasProject = projectId === "__new" || availableProjects.some((project) => project.id === projectId);
  const projectTasks = tasks.filter((task) => task.projectId === projectId && task.area === area && !task.archivedAt && (!task.completed || task.id === original?.id));
  const linkedStandaloneTask = original?.id === taskId && original.area === area && (!projectId || original.projectId === projectId);
  const selectedTaskId = (hasProject || linkedStandaloneTask) && (linkedStandaloneTask || taskId === "__new" || projectTasks.some((task) => task.id === taskId)) ? taskId : "";
  const assignmentFields = <>
    <div className="session-assignment-row">
      <div className="session-area-field"><span id="session-area-label">Area</span>
        <AreaToggle label="Session area" value={area} onChange={(next) => {
          if (next === area) return;
          setArea(next); setTaskId(""); setProjectId(""); setProjectName(""); setCategory(next === "do" ? "Work" : "Rest");
        }} />
      </div>
      <label>Category<select aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>{Array.from(new Set([category, ...categories])).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    </div>
    <div className="session-project-field">
      <label>Project <span className="optional">optional</span><select aria-label="Project" value={projectId} onChange={(event) => { setProjectId(event.target.value); setTaskId(""); }}>
        <option value="">No project</option>{projectId === "__new" && <option value="__new">New project</option>}
        {availableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select></label>
      <button type="button" className="text-button session-new-project" onClick={() => {setProjectId(projectId === "__new" ? "" : "__new");setTaskId("");}}>{projectId !== "__new" && <Plus size={14} />}{projectId === "__new" ? "Cancel new project" : "Create new project"}</button>
      {projectId === "__new" && <label>New project name<input name="projectName" maxLength={80} value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label>}
    </div>
    <label>What did you focus on?<input required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} /></label>
  </>;
  return <form className="form session-finish-form" onSubmit={(event) => {
    event.preventDefault();
    const duration = parseFocusedDuration(durationText);
    if (duration === null || duration > recordedSessionSeconds(timer)) { setEditingTime(true);setError("Use hh:mm:ss between 00:00:01 and the recorded session length.");return; }
    if (!title.trim()) { setError("Give this session a short name.");return; }
    if (projectId === "__new" && !projectName.trim()) { setError("Give the new project a name.");return; }
    setError("");
    onSave({ title: title.trim(), area, category, durationSeconds: duration,
      taskId: selectedTaskId && selectedTaskId !== "__new" ? selectedTaskId : undefined,
      createTask: selectedTaskId === "__new", projectId: projectId !== "__new" ? projectId || undefined : undefined,
      newProjectName: projectId === "__new" ? projectName.trim() : undefined, note });
  }}>
    <div className="session-receipt">
      <div className="session-time-tools"><button type="button" className="icon-button" title="Edit focused time" aria-label="Edit focused time" aria-pressed={editingTime} onClick={() => {setEditingTime(!editingTime);setConfirmReset(false);}}><Pencil size={15} /></button><button type="button" className="icon-button" title="Reset timer" aria-label="Reset timer" aria-expanded={confirmReset} onClick={() => setConfirmReset(!confirmReset)}><RotateCcw size={15} /></button></div>
      <span className="session-date">{new Date(timer.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
      {editingTime ? <input ref={timeInput} className="session-duration-input" aria-label="Focused duration" value={durationText} onChange={(event) => {setDurationText(event.target.value);setError("");}} placeholder="hh:mm:ss" autoComplete="off" spellCheck={false} /> : <strong>{durationText}</strong>}
      <span>{displayTime(timer.startedAt)}{timer.endedAt ? ` — ${displayTime(timer.endedAt)}` : ""}</span>
      <p className="form-hint">{editingTime ? "Edit focused time · hh:mm:ss" : "Focused time excludes pauses."}</p>
      {confirmReset && <div className="session-reset-confirm" role="group" aria-label="Confirm timer reset"><p>Reset this session? No time will be saved.</p><div><button className="secondary-button" type="button" onClick={onReset}>Reset</button><button className="text-button" type="button" onClick={() => setConfirmReset(false)}>Keep session</button></div></div>}
    </div>
    {assignmentFields}
    <details className="session-extra-details" open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
      <summary>Add details <span className="optional">optional</span></summary>
      <div className="session-extra-content">
        {hasProject && <label>Task <span className="optional">optional</span><select aria-label="Task" value={selectedTaskId} onChange={(event) => {
          setTaskId(event.target.value);const task=projectTasks.find((task) => task.id === event.target.value);if(task){setTitle(task.title);setCategory(task.category);}
        }}><option value="">No task</option>{taskId === "__new" && <option value="__new">New task from this session</option>}{projectTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>}
        {hasProject && <button type="button" className="text-button" onClick={() => setTaskId(taskId === "__new" ? "" : "__new")}>{taskId === "__new" ? "Cancel new task" : "Create a task from this session"}</button>}
        <label>A note<textarea aria-label="Session note" rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Anything you’d like to remember?" /></label>

      </div>
    </details>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="session-finish-actions"><button className="primary-button" type="submit">Save time <ArrowRight size={16} /></button></div>
  </form>;
}
