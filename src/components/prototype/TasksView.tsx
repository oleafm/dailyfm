"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Archive, Play, Check, Plus } from "lucide-react";
import { ActiveTimer, PrototypeState, Task, TaskNote, TaskStatus, TimerSession } from "@/lib/prototype/types";
import { taskHistory, taskStatus } from "@/lib/prototype/tasks";
import { displayTime } from "@/lib/prototype/sessions";
import { dateKey, prettyDate } from "@/lib/prototype/seed";
import { clock } from "./TimerCard";
import { TaskList } from "./Views";
import { Empty, SectionHeading } from "./UI";
const statusNames = { todo: "To do", in_progress: "In progress", done: "Done" };
type TaskChanges = Pick<Task, "title" | "description" | "notes">;
interface Props {
  state: PrototypeState; selected: string | null; timer: ActiveTimer | null; seconds: number;
  onOpen: (id: string) => void; onBack: () => void; onNew: () => void;
  onToggle: (id: string) => void; onFocus: (id: string) => void;
  onStatus: (id: string, status: TaskStatus) => void;
  onEdit: (id: string, changes: Partial<TaskChanges>) => void;
  onArchive: (id: string, archived: boolean) => void;
  onSession: (id: string, taskId: string, note: string) => void;
}
export default function TasksView(props: Props) {
  const [filter, setFilter] = useState("open");
  const task = props.state.tasks.find((task) => task.id === props.selected);
  if (props.selected) return task ? <TaskDetail key={task.id} {...props} task={task} /> : <>
    <button className="text-button back-link" onClick={props.onBack}><ArrowLeft size={16} />All tasks</button>
    <Empty>This task isn’t available in your account.</Empty>
  </>;
  const tasks = props.state.tasks.filter((task) => filter === "archived" ? !!task.archivedAt : !task.archivedAt && (filter === "all" || (filter === "open" ? !task.completed : taskStatus(task) === filter)));
  return <>
    <div className="page-intro"><p className="eyebrow">ONE STEP AT A TIME</p><h1>Your tasks.</h1><p>A home for the work that takes more than one sitting.</p></div>
    <div className="task-index-actions"><div className="filter-tabs" role="group" aria-label="Filter tasks">{[["open", "Open"], ["done", "Done"], ["all", "All"], ["archived", "Archived"]].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <button className="primary-button" onClick={props.onNew}><Plus size={16} />Add a task</button>
    </div>
    <section className="card task-index-list"><TaskList tasks={tasks} onToggle={props.onToggle} onFocus={props.onFocus} onOpen={props.onOpen} /></section>
  </>;
}
function TaskDetail(props: Props & { task: Task }) {
  const { task, state, timer, seconds } = props;
  const history = taskHistory(state, task.id);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [newNote, setNewNote] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sessionEditor, setSessionEditor] = useState<string | null>(null);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const notes = [...(task.notes || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = timer?.taskId === task.id;
  const status = taskStatus(task);
  const patchNotes = (notes: TaskNote[]) => props.onEdit(task.id, { notes });
  return <div className="task-detail">
    <button className="text-button back-link" onClick={props.onBack}><ArrowLeft size={16} />All tasks</button>
    <div className="task-detail-heading"><div className="page-intro"><p className="eyebrow">{task.area === "do" ? "SOMETHING YOU’RE MOVING FORWARD" : "SOMETHING YOU’RE MAKING ROOM FOR"}</p><h1>{task.title}</h1>
      <p>{statusNames[status]}{task.projectId && state.projects.find((project) => project.id === task.projectId) ? ` · ${state.projects.find((project) => project.id === task.projectId)!.name}` : ""}{task.archivedAt ? " · Archived" : ""}</p></div>
      <div className="task-detail-actions">{!task.archivedAt && <>
        {!task.completed && <button className="primary-button" onClick={() => props.onFocus(task.id)}><Play size={15} />{active ? timer?.runningSince !== null ? "Timer running" : "Resume focus" : "Start focus"}</button>}
        <button className="secondary-button" onClick={() => props.onToggle(task.id)}><Check size={15} />{task.completed ? "Reopen task" : "Mark done"}</button>
      </>}</div>
    </div>
    {active && <p className="task-active-timer" role="status">{timer?.runningSince !== null ? "Focus in progress" : "Focus paused"} · {clock(seconds)}<span>Marking this task Done will save this session automatically.</span></p>}
    <div className="task-stat-grid">{[[clock(history.seconds), "total focused time"], [String(history.sessions.length), "saved sessions"], [String(history.days), "days with focus"]].map(([value,label]) => <div className="card" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <div className="task-workspace-grid">
      <section className="card"><SectionHeading title="The task, in a little more detail." />
        <form className="form" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; props.onEdit(task.id, { title: title.trim(), description: description.trim() }); setDetailsSaved(true); }}>
          <label>Task name<input required maxLength={100} value={title} onChange={(event) => {setTitle(event.target.value);setDetailsSaved(false);}} /></label>
          <label>Description<textarea aria-label="Description" rows={5} maxLength={6000} value={description} onChange={(event) => {setDescription(event.target.value);setDetailsSaved(false);}} placeholder="What does this task involve? What will done look like?" /></label>
          <label>Status<select aria-label="Status" value={status} disabled={!!task.archivedAt} onChange={(event) => props.onStatus(task.id, event.target.value as TaskStatus)}>{Object.entries(statusNames).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button className="secondary-button" type="submit">Save changes</button>{detailsSaved && <p className="form-hint" role="status">Task details updated.</p>}
        </form>
      </section>
      <section className="card task-notes"><SectionHeading title="Progress, in your words." />
        <form className="form" onSubmit={(event) => { event.preventDefault(); if (!newNote.trim()) return; patchNotes([...(task.notes || []), {id:crypto.randomUUID(),text:newNote.trim(),createdAt:new Date().toISOString()}]);setNewNote(""); }}>
          <label>Add a progress note<textarea aria-label="Add a progress note" rows={3} maxLength={3000} value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="What moved forward? Anything to pick up next time?" required /></label><button className="secondary-button" type="submit">Add note <Plus size={15} /></button>
        </form>
        <div className="task-note-list">{notes.map((note) => <article key={note.id}>
          <time dateTime={note.createdAt}>{prettyDate(dateKey(new Date(note.createdAt)), {month:"short",day:"numeric",year:"numeric"})} · {displayTime(note.createdAt)}{note.updatedAt ? " · edited" : ""}</time>
          {editing === note.id ? <form className="form" onSubmit={(event) => {event.preventDefault();if(!noteText.trim())return;patchNotes((task.notes || []).map((item) => item.id === note.id ? {...item,text:noteText.trim(),updatedAt:new Date().toISOString()} : item));setEditing(null);}}>
            <label>Edit progress note<textarea aria-label="Edit progress note" required rows={3} maxLength={3000} value={noteText} onChange={(event) => setNoteText(event.target.value)} /></label><div className="task-inline-actions"><button className="secondary-button">Save note</button><button type="button" className="text-button" onClick={() => setEditing(null)}>Cancel</button></div>
          </form> : <><p>{note.text}</p><div className="task-inline-actions"><button className="text-button" onClick={() => {setEditing(note.id);setNoteText(note.text);}}>Edit note</button><button className="text-button" onClick={() => setDeleting(note.id)}>Delete note</button></div></>}
          {deleting === note.id && <div className="task-inline-actions" role="group" aria-label="Delete this note?"><span>Delete this note?</span><button className="text-button" onClick={() => {patchNotes((task.notes || []).filter((item) => item.id !== note.id));setDeleting(null);}}>Confirm delete</button><button className="text-button" onClick={() => setDeleting(null)}>Cancel</button></div>}
        </article>)}{!notes.length && <p className="muted">A little context for your next session. No notes yet.</p>}</div>
      </section>
    </div>
    <section className="card task-session-history"><SectionHeading eyebrow="ONE SESSION AT A TIME" title="Your time on this task." />
      <p className="form-hint">Saved sessions across all dates. Focused time excludes pauses; a running session is shown separately above.</p>
      {!history.sessions.length && <Empty>No saved sessions yet. Start a little focus when you’re ready.</Empty>}
      {history.sessions.map((session) => <article className="task-session" key={session.id}>
        <div className="task-session-heading"><div><time dateTime={session.startedAt}>{prettyDate(dateKey(new Date(session.startedAt)),{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</time><p>{displayTime(session.startedAt)} — {session.endedAt ? `${dateKey(new Date(session.startedAt)) !== dateKey(new Date(session.endedAt)) ? prettyDate(dateKey(new Date(session.endedAt))) + " · " : ""}${displayTime(session.endedAt)}` : "End time not recorded"}</p></div><strong>{clock(session.durationSeconds)}<small>focused</small></strong></div>
        {session.note && <p className="task-session-note">{session.note}</p>}
        {sessionEditor === session.id ? <SessionEditor session={session} tasks={state.tasks} onCancel={() => setSessionEditor(null)} onSave={(taskId, note) => {props.onSession(session.id, taskId, note);setSessionEditor(null);}} /> : <button className="text-button" onClick={() => setSessionEditor(session.id)}>Edit session details <ArrowRight size={13} /></button>}
      </article>)}
    </section>
    <div className="task-archive-action"><p>{task.archivedAt ? "Archived tasks keep their notes and recorded time." : "Archiving keeps your notes and recorded time, and hides the task from active lists."}</p><button className="text-button" onClick={() => props.onArchive(task.id,!task.archivedAt)}><Archive size={15} />{task.archivedAt ? "Restore task" : "Archive task"}</button></div>
  </div>;
}
function SessionEditor({ session, tasks, onSave, onCancel }: {session:TimerSession;tasks:Task[];onSave:(taskId:string,note:string)=>void;onCancel:()=>void}) {
  const [taskId,setTaskId]=useState(session.taskId || "");const [note,setNote]=useState(session.note);
  return <form className="form task-session-editor" onSubmit={(event)=>{event.preventDefault();onSave(taskId,note);}}>
    <label>Task<select aria-label="Task" value={taskId} onChange={(event)=>setTaskId(event.target.value)}>{tasks.filter((task)=>!task.archivedAt || task.id===session.taskId).map((task)=><option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
    <label>Session note<textarea aria-label="Session note" rows={2} maxLength={1000} value={note} onChange={(event)=>setNote(event.target.value)} /></label>
    <div className="task-inline-actions"><button className="secondary-button" type="submit">Save session details</button><button className="text-button" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
