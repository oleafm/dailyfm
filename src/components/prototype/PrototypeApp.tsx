"use client";
import { useEffect, useRef, useState } from "react";
import { countdownTarget, finishTimer, timerDisplay, timerElapsed, TimerMode } from "@/lib/prototype/active-timer";
import { advancePomodoro, pomodoroPhaseElapsed, savePomodoroLogs, validPomodoroSettings } from "@/lib/prototype/pomodoro";
import { TimerChime } from "@/lib/prototype/timer-sound";
import { User as AccountUser } from "@supabase/supabase-js";
import AccountGate from "../account/AccountGate";
import { accountClient } from "@/lib/account/client";
import { useWorkspace } from "@/lib/account/useWorkspace";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Feather,
  Grid2X2,
  Leaf,
  Menu,
  Pause,
  Play,
  Plus,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import {
  ActiveTimer,
  Activity,
  Area,
  View,
  Task,
  TaskStatus,
} from "@/lib/prototype/types";
import {
  duration,
  momentum,
  prettyDate,
  relativeDay,
  streak,
} from "@/lib/prototype/seed";

import ActivityGrid from "./ActivityGrid";
import { ActivityFilters, activityFilterOptions, filterActivityHistory } from "@/lib/prototype/activity-filters";
import { projectArea, activeProjectsInArea, setProjectCompleted, editProjectSessionNote } from "@/lib/prototype/projects";
import TasksView from "./TasksView";
import { changeTaskStatus, editTaskSession, taskStatus } from "@/lib/prototype/tasks";
import QuoteCard from "./QuoteCard";
import TodayColumns from "./TodayColumns";
import ReflectView, { GuidedJournalForm } from "./ReflectView";
import { saveReflection } from "@/lib/prototype/journal";
import TimerCard, { clock } from "./TimerCard";
import {
  ActivityForm,
  ChallengeForm,
  CompletionForm,
  ProjectForm,
  TaskForm,
  uid,
} from "./Forms";
import {
  ActivityRows,
  InsightsView,
  MemoriesView,
  PlanCard,
  ProjectsView,
  ReflectionCard,
} from "./Views";
import { Modal, SectionHeading } from "./UI";
import Illustration from "./Illustration";
import SessionFinishForm from "./SessionFinishForm";
import { chronologicalActivities, finishSession, SessionDetails } from "@/lib/prototype/sessions";
import SproutCelebration, { CelebrationKind } from "./SproutCelebration";

type Dialog = {
  type:
    | "task"
    | "account"
    | "activity"
    | "checkin"
    | "project"
    | "challenge"
    | "completion"
    | "memory"
    | "day"
    | "session"
    | "momentum"
    | "about";
  id?: string;
  category?: string;
  history?: boolean;
};
const navigation: { view: View; label: string; icon: typeof Grid2X2 }[] = [
  { view: "today", label: "Today", icon: Grid2X2 },
  { view: "projects", label: "Projects", icon: Feather },
  { view: "reflect", label: "Reflect", icon: Leaf },
  { view: "insights", label: "Weekly notes", icon: BookOpen },
];
const TIMER_KEY = "timerfm-active-timer-v1";
export default function PrototypeApp(props: { initialView?: View; initialProject?: string | null; initialTask?: string | null }) {
  return <AccountGate>{(account) => <Workspace key={account?.id || "demo"} {...props} account={account} />}</AccountGate>;
}
function Workspace({
  initialView = "today",
  initialProject = null,
  initialTask = null,
  account,
}: {
  initialView?: View;
  initialProject?: string | null;
  initialTask?: string | null;
  account: AccountUser | null;
}) {
  const { state, setState, ready: dataReady, status: saveStatus, error: saveError, retry, loadCloud } = useWorkspace(account);
  const hasConflict = saveStatus === "conflict";
  const timerKey = account ? `${TIMER_KEY}:${account.id}` : TIMER_KEY;
  const [accountError, setAccountError] = useState("");
  const [ready, setReady] = useState(false),
    [area, setArea] = useState<Area>("do");
  const [historyFilters, setHistoryFilters] = useState<ActivityFilters>({ area: "do", projectId: "", category: "" });
  const historyOptions = activityFilterOptions(state.activities, state.projects, area);
  const effectiveHistoryFilters: ActivityFilters = {
    area,
    projectId: historyFilters.area === area && historyOptions.projects.some(p => p.id === historyFilters.projectId) ? historyFilters.projectId : "",
    category: historyFilters.area === area && historyOptions.categories.includes(historyFilters.category) ? historyFilters.category : "",
  };
  const historyActivities = filterActivityHistory(state.activities, effectiveHistoryFilters);
  const [view, setView] = useState<View>(initialView === "tasks" ? "projects" : initialView),
    [selectedProject, setSelectedProject] = useState<string | null>(
      initialProject,
    );
  const [selectedTask, setSelectedTask] = useState<string | null>(initialTask);
  const [dialog, setDialog] = useState<Dialog | null>(null),
    [toast, setToast] = useState("");
  const [timer, setTimer] = useState<ActiveTimer | null>(null),
    [now, setNow] = useState(Date.now());
  const [timerMode, setTimerMode] = useState<TimerMode>("stopwatch");
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [pomodoroSettings, setPomodoroSettings] = useState({ focusSeconds: 1500, breakSeconds: 300, totalSessions: 4 });
  const [pendingTaskCompletion, setPendingTaskCompletion] = useState<string | null>(null);
  const notifiedPomodoro = useRef<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const chime = useRef<TimerChime | null>(null);
  const notifiedCountdown = useRef<string | null>(null);
  useEffect(() => () => { chime.current?.close(); }, []);
  function armSound() { chime.current ??= new TimerChime(); void chime.current.arm(); }
  function previewSound() {
    chime.current ??= new TimerChime();
    void chime.current.arm().then(ready => { if (ready) chime.current?.play(); else setToast("Sound is unavailable in this browser. The timer will still show when time is up."); });
  }
  const [storageWarning, setStorageWarning] = useState(false);
  const [celebration, setCelebration] = useState<{ kind: CelebrationKind; message?: string; id: number } | null>(null);
  function celebrate(kind: CelebrationKind, message?: string) {
    setToast("");
    setCelebration((previous) => ({ kind, message, id: (previous?.id ?? 0) + 1 }));
  }
  const [mobileMenu, setMobileMenu] = useState(false);
  const [focusVisible, setFocusVisible] = useState(true);
  const focusRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const floatingVisible = !!timer && (view !== "today" || !focusVisible);
  useEffect(() => {
    if (!dataReady) return;
    try {
      const preferences = JSON.parse(localStorage.getItem(`${timerKey}:preferences`) || "null");
      if (preferences) {
        setTimerMode(preferences.mode === "pomodoro" ? "pomodoro" : preferences.mode === "countdown" ? "countdown" : "stopwatch");
        if (preferences.pomodoro && validPomodoroSettings(preferences.pomodoro)) setPomodoroSettings(preferences.pomodoro);
        if (Number.isInteger(preferences.minutes) && preferences.minutes >= 1 && preferences.minutes <= 1440) setCountdownMinutes(preferences.minutes);
        setSoundEnabled(preferences.sound !== false);
      }
      const stored = JSON.parse(localStorage.getItem(timerKey) || "null");
      if (
        stored &&
        (!stored.taskId || state.tasks.some((t) => t.id === stored.taskId && !t.completed && !t.archivedAt)) &&
        typeof stored.elapsed === "number" &&
        (stored.runningSince === null ||
          typeof stored.runningSince === "number")
      )
        { if (stored.mode !== "pomodoro" || (stored.pomodoro && validPomodoroSettings(stored.pomodoro) && Array.isArray(stored.pomodoro.logs))) setTimer(stored); }
    } catch {
      /* A fresh timer is fine. */
    }
    const restoreLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("view");
      const taskPath = window.location.pathname.match(/^\/tasks\/([^/]+)\/?$/);
      const taskId = taskPath ? decodeURIComponent(taskPath[1]) : params.get("task");
      setSelectedTask(taskId);
      setView(
        taskPath ? "projects" : window.location.pathname === "/tasks" || requested === "tasks" ? "projects" : navigation.some((n) => n.view === requested)
          ? (requested as View)
          : window.location.pathname === "/" ? "today" : initialView,
      );
      const projectId = params.get("project") || (taskPath ? state.tasks.find((task) => task.id === taskId)?.projectId || null : requested ? null : initialProject);
      setSelectedProject(projectId);
      const project = state.projects.find((project) => project.id === projectId);
      setArea(taskPath ? state.tasks.find((task) => task.id === taskId)?.area || (project ? projectArea(project) : "do") : project ? projectArea(project) : params.get("area") === "be" ? "be" : "do");
    };
    restoreLocation();
    window.addEventListener("popstate", restoreLocation);
    setReady(true);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, [dataReady, initialView, initialProject, timerKey]);
  useEffect(() => {
    if (ready) {
      try {
        if (timer) localStorage.setItem(timerKey, JSON.stringify(timer));
        else localStorage.removeItem(timerKey);
        setStorageWarning(false);
      } catch {
        setStorageWarning(true);
      }
    }
  }, [timer, ready, timerKey]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(`${timerKey}:preferences`, JSON.stringify({ mode: timerMode, minutes: countdownMinutes, sound: soundEnabled, pomodoro: pomodoroSettings })); } catch { /* Timer controls still work without saved preferences. */ }
  }, [ready, timerKey, timerMode, countdownMinutes, soundEnabled, pomodoroSettings]);
  useEffect(() => {
    if (!timer?.runningSince) return;
    const update = () => setNow(Date.now());
    const tick = setInterval(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(tick); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, [timer?.runningSince]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    if (view !== "today" || !ready || hasConflict || !clockRef.current || !headerRef.current)
      return;
    const header = headerRef.current;
    const clock = clockRef.current;
    let observer: IntersectionObserver;
    const observeClock = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => setFocusVisible(entry.isIntersecting),
        {
          threshold: 0,
          rootMargin: `-${header.offsetHeight}px 0px 0px 0px`,
        },
      );
      observer.observe(clock);
    };
    observeClock();
    const resize = new ResizeObserver(observeClock);
    resize.observe(header);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, [view, ready, hasConflict]);
  const today = relativeDay(0);
  const seconds = timer ? timerElapsed(timer, now) : 0;
  const displayedSeconds = timer ? timerDisplay(timer, now) : 0;
  function completeCountdown(current: ActiveTimer, at: number) {
    setTimer(finishTimer(current, at));
    setDialog({ type: "session" });
    if (notifiedCountdown.current === current.startedAt) return;
    notifiedCountdown.current = current.startedAt;
    const sounded = current.soundEnabled !== false && chime.current?.play();
    setToast(current.soundEnabled !== false && !sounded ? "Time is up. Sound is unavailable; review your session below." : "Time is up. Your focus session is ready to save.");
  }
  useEffect(() => {
    if (!ready || !timer || timer.runningSince === null || timer.countdownCompleted) return;
    const target = countdownTarget(timer);
    if (target !== null && timerElapsed(timer, now) >= target) completeCountdown(timer, now);
  }, [timer, now, ready]);
  function announcePomodoroPhase(current: ActiveTimer) {
    const p = current.pomodoro!;
    const key = `${current.startedAt}:${p.phase}:${p.session}:${current.countdownCompleted}`;
    if (notifiedPomodoro.current === key) return;
    notifiedPomodoro.current = key;
    const sounded = current.soundEnabled !== false && chime.current?.play();
    const message = current.countdownCompleted ? "Pomodoro finished. Choose which focus logs to save." : p.phase === "break" ? "Focus complete. Your break has started." : `Break complete. Focus session ${p.session} has started.`;
    setToast(message + (current.soundEnabled !== false && !sounded ? " Sound is unavailable in this browser." : ""));
  }
  useEffect(() => {
    if (!ready || timer?.mode !== "pomodoro" || !timer.pomodoro || timer.runningSince === null || timer.countdownCompleted) return;
    const next = advancePomodoro(timer, now);
    if (next === timer) return;
    setTimer(next); announcePomodoroPhase(next);
    if (next.countdownCompleted) setDialog({ type: "session" });
  }, [timer, now, ready]);
  const activeTask = state.tasks.find((t) => t.id === timer?.taskId);
  const activeProject = state.projects.find((project) => project.id === timer?.projectId);
  const todays = state.activities.filter((a) => a.date === today);
  const checkIn = state.checkIns.find((c) => c.date === today);
  const close = () => setDialog(null);
  const announce = (message: string, kind: CelebrationKind | false = "task") => {
    if (kind) celebrate(kind, message);
    else {
      setCelebration(null);
      setToast(message);
    }
    close();
  };
  function navigate(
    next: View,
    project: string | null = null,
    nextArea: Area = area,
  ) {
    const targetProject = next === "projects" ? state.projects.find((item) => item.id === project) : undefined;
    const targetArea = targetProject ? projectArea(targetProject) : nextArea;
    setView(next);
    setSelectedTask(null);
    setArea(targetArea);
    setSelectedProject(project);
    setMobileMenu(false);
    const params = new URLSearchParams({ view: next, area: targetArea });
    if (project) params.set("project", project);
    window.history.pushState(null, "", `/?${params}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function switchArea(nextArea: Area) {
    if (nextArea === area) return;
    setHistoryFilters({ area: nextArea, projectId: "", category: "" });
    navigate(view === "tasks" ? "projects" : view, null, nextArea);
  }
  function openTask(id: string, taskArea?: Area) {
    const task = state.tasks.find((task) => task.id === id);
    setSelectedTask(id); setMobileMenu(false);
    if (task || taskArea) setArea(taskArea || task!.area);
    const url = new URL(window.location.href); url.searchParams.set("task",id);
    window.history.pushState(null,"",url.pathname+url.search);
  }
  function closeTask() {
    setSelectedTask(null);
    const url = new URL(window.location.href);
    if (url.pathname.startsWith("/tasks/")) {
      navigate("projects", state.tasks.find((task) => task.id === selectedTask)?.projectId || null);
    } else { url.searchParams.delete("task"); window.history.pushState(null,"",url.pathname+url.search); }
  }
  function startTimer(id?: string, projectId?: string) {
    if (timer?.countdownCompleted) { setDialog({ type: "session" }); return; }
    if (!timer && timerMode === "pomodoro" && !validPomodoroSettings(pomodoroSettings)) { setToast("Choose 1–180 focus minutes, 1–60 break minutes, and 1–12 sessions."); return; }
    if (!timer && timerMode === "countdown" && (!Number.isInteger(countdownMinutes) || countdownMinutes < 1 || countdownMinutes > 1440)) { setToast("Choose a countdown between 1 and 1,440 minutes."); return; }
    if ((timer ? timer.mode !== "stopwatch" && timer.soundEnabled !== false : timerMode !== "stopwatch" && soundEnabled)) armSound();
    const selected = state.tasks.find((task) => task.id === id);
    if (selected?.completed || selected?.archivedAt) { setToast("Reopen or restore this task before starting focus."); return; }

    if (timer && ((id && timer.taskId !== id) || (projectId && (timer.projectId !== projectId || timer.taskId)))) {
      setToast("Finish your current session first. One thing at a time.");
      return;
    }
    const contextProjectId = selected ? selected.projectId : projectId || (view === "projects" ? selectedProject || undefined : undefined);
    const contextProject = state.projects.find((project) => project.id === contextProjectId);
    if (contextProject?.completedAt && !timer) { setToast("Reopen this project before starting focus."); return; }
    const time = Date.now();
    setNow(time);
    if (id) setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id && !task.completed ? { ...task, status: "in_progress" } : task) }));
    setTimer((current) =>
      current
        ? { ...current, endedAt: undefined, runningSince: current.runningSince || time }
        : {
            mode: timerMode,
            pomodoro: timerMode === "pomodoro" ? { ...pomodoroSettings, phase: "focus", session: 1, phaseStartedAt: new Date(time).toISOString(), logs: [] } : undefined,
            targetSeconds: timerMode === "countdown" ? countdownMinutes * 60 : undefined,
            soundEnabled,
            taskId: id,
            projectId: contextProjectId,
            area: selected?.area || (contextProject ? projectArea(contextProject) : area),
            startedAt: new Date(time).toISOString(),
            elapsed: 0,
            runningSince: time,
          },
    );
  }
  function focusTask(id: string) {
    startTimer(id);
    const task = state.tasks.find((t) => t.id === id);
    navigate("today", null, !timer && task ? task.area : area);
    setTimeout(
      () =>
        focusRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      80,
    );
  }
  function pauseTimer() {
    const time = Date.now();
    if (timer?.mode === "pomodoro" && timer.pomodoro) {
      const next = advancePomodoro(timer, time);
      if (next !== timer) announcePomodoroPhase(next);
      setNow(time);
      setTimer(next.countdownCompleted ? next : { ...next, elapsed: pomodoroPhaseElapsed(next, time), runningSince: null });
      if (next.countdownCompleted) setDialog({ type: "session" });
      return;
    }
    if (timer && countdownTarget(timer) !== null && timerElapsed(timer, time) >= countdownTarget(timer)!) { completeCountdown(timer, time); return; }
    setNow(time);
    setTimer((current) =>
      current
        ? {
            ...current,
            elapsed: timerElapsed(current, time),
            runningSince: null,
          }
        : null,
    );
  }
  function stopTimer() {
    if (!timer) return;
    const at = Date.now();
    setNow(at);
    if (countdownTarget(timer) !== null && timerElapsed(timer, at) >= countdownTarget(timer)!) { completeCountdown(timer, at); return; }
    setTimer(finishTimer(timer, at));
    setDialog({ type: "session" });
  }
  function saveSession(details: SessionDetails) {
    if (!timer) return;
    const measured = Math.max(1, seconds);
    const elapsed = details.durationSeconds ?? measured;
    setState((current) => {
      const next = timer.mode === "pomodoro" ? savePomodoroLogs(current, timer, details, uid) : finishSession(current, timer, measured, details, uid);
      return pendingTaskCompletion ? changeTaskStatus(next, pendingTaskCompletion, "done", null, Date.now(), uid) : next;
    });
    setPendingTaskCompletion(null);
    setTimer(null);
    announce(account ? `Recorded ${clock(elapsed)} of focus. Saving to your account…` : `Saved ${clock(elapsed)} of focus.`, "session");
  }
  function setTaskStatus(id: string, status: TaskStatus) {
    const task = state.tasks.find((task) => task.id === id);
    if (!task || taskStatus(task) === status) return;
    if (status === "done" && timer?.taskId === id && timer.mode === "pomodoro") { setPendingTaskCompletion(id); stopTimer(); return; }
    const at = Date.now();
    setState((current) => changeTaskStatus(current, id, status, timer, at, uid));
    if (status === "done" && timer?.taskId === id) { setTimer(null); close(); }
    if (status === "done") celebrate("task", `Completed “${task.title}”.${timer?.taskId === id ? " Your focus session was saved too." : " One small step forward."}`);
  }
  function toggleTask(id: string) {
    const task = state.tasks.find((task) => task.id === id);
    if (task) setTaskStatus(id, task.completed ? "todo" : "done");
  }
  function editTask(id: string, changes: Partial<Pick<Task, "title" | "description" | "notes">>) {
    setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...changes } : task) }));
  }
  function archiveTask(id: string, archived: boolean) {
    if (archived && timer?.taskId === id) { setToast("Finish your focus session before archiving this task."); return; }
    setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, archivedAt: archived ? new Date().toISOString() : undefined } : task) }));
  }
  function addActivity(activity: Activity) {
    setState((s) => ({ ...s, activities: [...s.activities, { ...activity, recordedAt: new Date().toISOString() }] }));
    announce(`Logged “${activity.title}”. A little piece of your day, kept.`);
  }
  const selectedChallenge = state.challenges.find((c) => c.id === dialog?.id);
  const selectedMemory = state.completions.find((c) => c.id === dialog?.id);
  const selectedDay = dialog?.type === "day" ? dialog.id || today : today;
  const dayActivities = (dialog?.history ? historyActivities : state.activities).filter((a) => a.date === selectedDay);
  const momentumActivities = dialog?.history ? historyActivities : state.activities;
  const dayCheckIn = state.checkIns.find((c) => c.date === selectedDay);
  if (account && (!dataReady || saveStatus === "conflict"))
    return (
      <main className="account-screen"><section className="account-card">
        <h1>{saveStatus === "conflict" ? "Let’s keep your changes safe." : "Opening your space…"}</h1>
        {saveError && <p role="alert" className="account-error">{saveError}</p>}
        {saveStatus === "conflict" ? <>
          <p className="muted">Download your unsaved changes for recovery. Loading the account version replaces the unsaved changes in this browser.</p>
          <button className="secondary-button" onClick={() => {
            const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
            const link = document.createElement("a"); link.href = url; link.download = "to-daily-unsaved.json"; link.click(); URL.revokeObjectURL(url);
          }}>Download my changes</button>
          <button className="primary-button" onClick={() => void loadCloud()}>Load account version</button>
        </> : saveStatus === "error" && <button className="primary-button" onClick={retry}>Retry connection</button>}
      </section></main>
    );
  if (!ready)
    return (
      <div className="loading-screen">
        <Sprout size={32} strokeWidth={1} />
        <span>Making a little room…</span>
      </div>
    );
  return (
    <div className={`app-shell area-${area}`}>
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("today")}
          aria-label="do.daily home"
        >
          <span className="brand-mark" aria-hidden="true">
            <Sprout size={25} strokeWidth={1.6} />
          </span>
          <span>
            do.daily
            <small>Grow every day</small>
          </span>
        </button>
        <button
          className="mobile-menu-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        >
          <X size={19} />
        </button>
        <p className="nav-caption">YOUR SPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ view: next, label, icon: Icon }) => (
            <button
              key={next}
              className={`nav-item ${view === next || (view === "tasks" && next === "projects") ? "active" : ""}`}
              aria-current={view === next || (view === "tasks" && next === "projects") ? "page" : undefined}
              onClick={() => navigate(next)}
            >
              <Icon size={18} strokeWidth={1.6} />
              {label}
              {next === "today" && <span className="nav-today-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="nav-caption">
            YOUR PROJECTS
            <button
              className="icon-button"
              aria-label="Create project"
              onClick={() => setDialog({ type: "project" })}
            >
              <Plus size={14} />
            </button>
          </div>
          {activeProjectsInArea(state.projects, area).slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => navigate("projects", p.id)}
              className={
                (selectedProject === p.id && view === "projects") || (view === "tasks" && state.tasks.find((task) => task.id === selectedTask)?.projectId === p.id)
                  ? "selected"
                  : ""
              }
            >
              <span className={`project-dot ${p.color}`} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          {!timer && (
            <button
              className="sidebar-focus"
              onClick={() => startTimer()}
              aria-label="Start new focus"
            >
              <span className="sidebar-focus-play"><Play size={16} fill="currentColor" /></span>
              <span>Start new focus</span>
            </button>
          )}
          <button
            className="profile"
            onClick={() => setDialog({ type: account ? "account" : "about" })}
          >
            <span className="avatar">{state.user.name.slice(0, 1).toUpperCase()}</span>
            <span>
              {state.user.name}
              <small>A work in progress, too.</small>
            </span>
            <ChevronRight size={15} />
          </button>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="app-main">
        <header ref={headerRef} className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button icon-button"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Your space<span>/</span>
              {view === "tasks" ? "Projects" : navigation.find((n) => n.view === view)?.label}
            </span>
            <span className="mobile-brand">do.daily</span>
          </div>
          <div className="area-switch" aria-label="Choose an area">
            <button
              className={area === "do" ? "selected" : ""}
              aria-pressed={area === "do"}
              onClick={() => {
                switchArea("do");
              }}
            >
              <BriefcaseBusiness size={14} />
              Do<span>make things happen</span>
            </button>
            <button
              className={area === "be" ? "selected" : ""}
              aria-pressed={area === "be"}
              onClick={() => {
                switchArea("be");
              }}
            >
              <Leaf size={14} />
              Be<span>be here for life</span>
            </button>
          </div>
          <button
            className="quick-log"
            aria-label="Log an activity"
            onClick={() => setDialog({ type: "activity" })}
          >
            <Plus size={16} />
            <span>Log a little something</span>
          </button>
          {account && <button
            className="mobile-account-button avatar"
            aria-label="Your account"
            onClick={() => setDialog({ type: "account" })}
          >{state.user.name.slice(0, 1).toUpperCase()}</button>}
        </header>
        <main id="main-content" className="page-content">
          {saveStatus === "error" && <div className={`account-save-status ${saveStatus === "error" ? "has-error" : ""}`} role="status" aria-live="polite">
            {account ? <>
              <span className="live-dot" />
              <span>Not saved to your account. Keep this tab open.</span>
              {saveStatus === "error" && <button className="text-button" onClick={retry}>Retry save</button>}
              {saveError && <span>{saveError}</span>}
            </> : <span>{saveError || "Changes could not be saved. Keep this tab open."}</span>}
          </div>}
          {storageWarning && (
            <div className="storage-warning" role="status">
              Your running timer could not be backed up on this device. Keep this tab open until you finish and save your session.
            </div>
          )}
          {view === "today" && (
            <>
              <div className="page-intro today-intro">
                <div>
                  <p className="eyebrow">
                    <span className="live-dot" />
                    {prettyDate(today, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h1>
                    {area === "do" ? (
                      <>
                        Make time
                        <br />
                        <em>for what matters.</em>
                      </>
                    ) : (
                      <>
                        Less doing.
                        <br />
                        <em>More being.</em>
                      </>
                    )}
                  </h1>
                  <p>
                    {area === "do"
                      ? "You don’t have to do it all. Just something that matters."
                      : "A walk. A conversation. A moment that feels like you."}
                  </p>
                </div>
                <div className="today-note">
                  <Illustration kind={area === "do" ? "steps" : "balance"} />
                  <span>
                    <strong>{String(todays.length).padStart(2, "0")}</strong>{" "}
                    meaningful moments today
                  </span>
                </div>
              </div>
              <div className="dashboard-grid">
                <ActivityGrid
                  activities={historyActivities}
                  area={area}
                  projects={historyOptions.projects}
                  categories={historyOptions.categories}
                  filters={effectiveHistoryFilters}
                  onFiltersChange={setHistoryFilters}
                  registeredAt={account?.created_at}
                  onDay={(date) => setDialog({ type: "day", id: date, history: true })}
                  onMomentum={() => setDialog({ type: "momentum", history: true })}
                />
                <div ref={focusRef}>
                  <TimerCard
                    clockRef={clockRef}
                    mode={timerMode} onModeChange={setTimerMode}
                    pomodoroSettings={pomodoroSettings} onPomodoroChange={setPomodoroSettings} remainingSeconds={displayedSeconds}
                    countdownMinutes={countdownMinutes} onMinutesChange={setCountdownMinutes}
                    soundEnabled={soundEnabled} onSoundChange={setSoundEnabled} onPreviewSound={previewSound}
                    tasks={state.tasks}
                    projectName={activeProject?.name}
                    area={area}
                    timer={timer}
                    seconds={seconds}
                    onStart={startTimer}
                    onPause={pauseTimer}
                    onStop={stopTimer}
                  />
                </div>
              </div>
              <TodayColumns>
                <div className="today-content-column">
                  <PlanCard
                    area={area}
                    tasks={state.tasks.filter(task => !task.projectId || !state.projects.some(project => project.id === task.projectId && projectArea(project) === "be"))}
                    onToggle={toggleTask}
                    onFocus={focusTask}
                    onOpen={openTask}
                    onNew={() => setDialog({ type: "task" })}
                    onCategory={(category) =>
                      setDialog({ type: "activity", category })
                    }
                  />
                  <section className="card today-story">
                    <SectionHeading
                      eyebrow="YOU SHOWED UP TODAY"
                      title="Here’s what happened."
                      action="Your day"
                      onAction={() => setDialog({ type: "day", id: today })}
                    />
                    <ActivityRows
                      activities={chronologicalActivities(todays.filter((a) => a.area === area).slice(-4), state.sessions)}
                      onOpenTask={openTask}
                    />
                    <button
                      className="text-button story-add"
                      onClick={() => setDialog({ type: "activity" })}
                    >
                      <Plus size={15} />
                      There was something else…
                    </button>
                  </section>
                </div>
                <div className="today-content-column">
                  <ReflectionCard
                    done={!!checkIn}
                    onClick={() => setDialog({ type: "checkin" })}
                  />
                  <QuoteCard compact />
                </div>
              </TodayColumns>
            </>
          )}
          {view === "projects" && (
            <ProjectsView
              key={`${area}-${selectedProject || "all"}`}
              state={state}
              area={area}
              selected={selectedProject}
              onSelect={(id) => navigate("projects", id)}
              onNew={() => setDialog({ type: "project" })}
              onToggleTask={toggleTask}
              onOpenTask={openTask}
              onFocus={(id) => startTimer(id)}
              onProjectFocus={(id) => startTimer(undefined, id)}
              activeTimerProject={timer?.projectId || state.tasks.find(t => t.id === timer?.taskId)?.projectId}
              onCompleteProject={(id, completed) => {
                if (completed && timer && (timer.projectId === id || state.tasks.find(t => t.id === timer.taskId)?.projectId === id)) return;
                setState(current => setProjectCompleted(current, id, completed, new Date().toISOString()));
              }}
              onSessionNote={(projectId, sessionId, note) => setState(current => editProjectSessionNote(current, projectId, sessionId, note))}
              onNewTask={() => setDialog({ type: "task" })}
            />
          )}
          {view === "memories" && (
            <MemoriesView
              state={state}
              onNew={() => setDialog({ type: "challenge" })}
              onChallenge={(id) => setDialog({ type: "completion", id })}
              onCompletion={(id) => setDialog({ type: "completion", id })}
              onMemory={(id) => setDialog({ type: "memory", id })}
            />
          )}
          {view === "reflect" && <ReflectView entries={state.checkIns} onWrite={(date) => setDialog({ type: "checkin", id: date })} />}
          {view === "insights" && (
            <InsightsView
              state={state}
              area={area}
              onCheckIn={() => setDialog({ type: "checkin" })}
              onLogActivity={() => setDialog({ type: "activity" })}
              onProject={(id) => navigate("projects", id)}
            />
          )}
          <footer className="page-footer">
            <span className="footer-brand">do.daily</span>
            <p>Evidence, not judgment.</p>
            <span>
              Made for a life in progress.
              <Sprout size={13} />
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ view: next, label, icon: Icon }) => (
          <button
            key={next}
            className={view === next || (view === "tasks" && next === "projects") ? "active" : ""}
            aria-current={view === next || (view === "tasks" && next === "projects") ? "page" : undefined}
            onClick={() => navigate(next)}
          >
            <Icon size={19} strokeWidth={1.5} />
            <span>{label === "Weekly notes" ? "Notes" : label}</span>
          </button>
        ))}
      </nav>
      {!timer && (
        <button
          className="mobile-focus-shortcut"
          aria-label="Start focus"
          onClick={() => startTimer()}
        >
          <Play size={20} fill="currentColor" />
        </button>
      )}
      {timer && (
        <div
          className={`floating-timer ${floatingVisible ? "is-visible" : ""}`}
          aria-hidden={!floatingVisible}
        >
          <button
            onClick={() => {
              navigate("today");
              setTimeout(
                () =>
                  focusRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  }),
                80,
              );
            }}
          >
            <span className={timer.runningSince ? "live-dot" : "paused-dot"} />
            {timer.mode === "pomodoro" && timer.pomodoro ? `${timer.pomodoro.phase === "break" ? "Break" : "Focus"} · ${timer.pomodoro.session}/${timer.pomodoro.totalSessions}` : activeTask?.title || activeProject?.name || "Focus session"}
            <strong aria-label={timer.mode !== "stopwatch" ? "Time remaining" : "Time elapsed"}>{clock(displayedSeconds)}</strong>
          </button>
          {!timer.countdownCompleted && <button
            className="icon-button"
            aria-label={timer.runningSince ? "Pause session" : "Resume session"}
            onClick={() =>
              timer.runningSince ? pauseTimer() : startTimer(timer.taskId)
            }
          >
            {timer.runningSince ? <Pause size={16} /> : <Play size={16} />}
          </button>}
          <button className="text-button" onClick={stopTimer}>
            {timer.countdownCompleted ? "Review" : "Finish"}
          </button>
        </div>
      )}
      {celebration && <SproutCelebration key={celebration.id} kind={celebration.kind} message={celebration.message} onClose={() => setCelebration(null)} />}
      <div
        className={`toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <Check size={16} />
            <span>{toast}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>
      {selectedTask && <Modal presentation="drawer" title="Task details" onClose={closeTask}>
        {account && saveStatus === "error" && <div className="account-save-status has-error" role="alert">Changes aren’t saved to your account yet. Keep this tab open and retry.<button className="text-button" onClick={retry}>Retry save</button></div>}
        <TasksView state={state} selected={selectedTask} timer={timer} seconds={seconds}
          onPause={pauseTimer} onFinish={stopTimer} onToggle={toggleTask} onStatus={setTaskStatus} onFocus={(id) => startTimer(id)} onEdit={editTask} onArchive={archiveTask}
          onSession={(id, taskId, note) => setState((current) => editTaskSession(current, id, taskId, note))} />
      </Modal>}
      {dialog?.type === "task" && (
        <Modal presentation="drawer"
          title="A small intention."
          eyebrow={area === "do" ? "MAKE THINGS HAPPEN" : "MAKE ROOM FOR LIFE"}
          onClose={close}
        >
          <TaskForm
            area={area}
            projects={state.projects}
            initialProject={view === "projects" ? selectedProject : undefined}
            onSave={(task) => {
              setState((s) => ({ ...s, tasks: [...s.tasks, task] }));
              setArea(task.area);
              openTask(task.id, task.area);
              announce(`Added “${task.title}”. A small intention, ready when you are.`);
            }}
          />
        </Modal>
      )}
      {dialog?.type === "activity" && (
        <Modal
          title="The little things count, too."
          eyebrow={area === "do" ? "A LITTLE DO" : "A LITTLE BE"}
          onClose={close}
        >
          <ActivityForm
            area={area}
            initialCategory={dialog.category}
            projects={state.projects}
            onSave={addActivity}
          />
        </Modal>
      )}
      {dialog?.type === "checkin" && (
        <Modal
          title="A little room for you."
          eyebrow="YOUR GUIDED REFLECTION"
          onClose={close}
        >
          <GuidedJournalForm
            key={dialog.id || today}
            date={dialog.id || today}
            existing={state.checkIns.find((entry) => entry.date === (dialog.id || today))}
            onSave={(entry) => {
              setState((s) => saveReflection(s, entry));
              announce("Reflection kept. A little more room for you.", "checkin");
            }}
          />
        </Modal>
      )}
      {dialog?.type === "project" && (
        <Modal
          title="Something worth making."
          eyebrow="A NEW PROJECT"
          onClose={close}
        >
          <ProjectForm
            initialArea={area}
            onSave={(project) => {
              setState((s) => ({ ...s, projects: [...s.projects, project] }));
              navigate("projects", project.id, projectArea(project));
              announce(`Created ${project.name}. A new space for something meaningful.`);
            }}
          />
        </Modal>
      )}
      {dialog?.type === "challenge" && (
        <Modal
          title="An invitation to yourself."
          eyebrow="A LITTLE NOVELTY"
          onClose={close}
        >
          <ChallengeForm
            onSave={(challenge) => {
              setState((s) => ({
                ...s,
                challenges: [...s.challenges, challenge],
              }));
              announce("Invitation created. Something new to look forward to.");
            }}
          />
        </Modal>
      )}
      {dialog?.type === "completion" && selectedChallenge && (
        <Modal
          title="You tried something."
          eyebrow={`${selectedChallenge.category.toUpperCase()} · KEEP THE MEMORY`}
          onClose={close}
        >
          <CompletionForm
            challenge={selectedChallenge}
            onSave={(entry) => {
              setState((s) => ({
                ...s,
                completions: [...s.completions, entry],
                activities: [
                  ...s.activities,
                  {
                    id: `challenge-${entry.id}`,
                    title: entry.title,
                    date: entry.date,
                    area: selectedChallenge.category === "Build" ? "do" : "be",
                    category: selectedChallenge.category,
                    kind: "challenge",
                    minutes: 0,
                    note: entry.note,
                    source: "manual",
                  },
                ],
              }));
              announce(`Saved “${entry.title}”. A new experience, a lasting memory.`);
            }}
          />
        </Modal>
      )}
      {dialog?.type === "memory" && selectedMemory && (
        <Modal
          title={selectedMemory.title}
          eyebrow={prettyDate(selectedMemory.date)}
          onClose={close}
        >
          <div className="memory-detail">
            <blockquote>“{selectedMemory.note}”</blockquote>
            <p>{selectedMemory.location || "Somewhere worth remembering"}</p>
            <div>
              <span>Would you do this again?</span>
              <strong>{selectedMemory.again}</strong>
            </div>
          </div>
        </Modal>
      )}
      {dialog?.type === "day" && (
        <Modal
          title={
            selectedDay === today
              ? "Today, in little pieces."
              : prettyDate(selectedDay)
          }
          eyebrow={
            selectedDay === today ? prettyDate(today) : "A DAY IN YOUR STORY"
          }
          onClose={close}
          wide
        >
          <p className="day-summary-intro">
            {dayActivities.length
              ? `${dayActivities.length} meaningful ${dayActivities.length === 1 ? "moment" : "moments"}. ${duration(dayActivities.reduce((s, a) => s + a.minutes, 0))} of intentional time.`
              : dialog.history ? "No activities match these filters for this day." : "Nothing recorded. A quiet day belongs in your story, too."}
          </p>
          <ActivityRows activities={dayActivities} sessions={state.sessions} />
          {dayCheckIn && !dialog.history && (
            <div className="day-reflection">
              <span>Mood · {dayCheckIn.mood}/10</span>
              <p>
                {dayCheckIn.reflection.text || "A moment to pause and notice."}
              </p>
            </div>
          )}
          <p className="form-hint">
            The squares show what you recorded. They don’t measure your worth.
          </p>
        </Modal>
      )}
      {dialog?.type === "session" && timer && (
        <Modal
          title="Save your time."
          className="session-review-modal"
          onClose={close}
        >
          <SessionFinishForm
            timer={timer}
            seconds={seconds}
            tasks={state.tasks}
            projects={state.projects}
            initialArea={area}
            onSave={saveSession}
            onReset={() => { setPendingTaskCompletion(null); setTimer(null); announce("Session reset. No time was saved.", false); }}
          />
        </Modal>
      )}
      {dialog?.type === "momentum" && (
        <Modal
          title="A rhythm, not a rating."
          eyebrow="UNDERSTANDING MOMENTUM"
          onClose={close}
        >
          <div className="momentum-explanation">
            <strong>
              {momentum(momentumActivities)}
              <ArrowUpRight size={28} />
            </strong>
            <p>
              Momentum reflects how often you’ve made room for meaningful things
              over the last 14 days.
            </p>
            <div>
              <span>Days with an activity</span>
              <b>
                {
                  new Set(
                    momentumActivities
                      .filter(
                        (a) => a.date >= relativeDay(-13) && a.date <= today,
                      )
                      .map((a) => a.date),
                  ).size
                }{" "}
                of 14
              </b>
            </div>
            <div>
              <span>Current rhythm</span>
              <b>{streak(momentumActivities)} days showing up</b>
            </div>
            <p className="muted">
              This prototype combines recent active days (up to 55 points) and
              activity frequency (up to 45). It isn’t a productivity score, a
              health assessment, or a measure of how well you’re living.
            </p>
            <p className="form-hint">
              Rest is part of the rhythm. You can always begin again.
            </p>
          </div>
        </Modal>
      )}
      {dialog?.type === "account" && account && (
        <Modal title="Your account." eyebrow="YOUR SPACE" onClose={close}>
          <form className="form" onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get("name")).trim();
            if (name) { setState((current) => ({ ...current, user: { ...current.user, name } })); close(); }
          }}>
            <p className="muted">{account.email}</p>
            <label>Your name<input name="name" defaultValue={state.user.name} required maxLength={80} /></label>
            <button className="primary-button">Save profile</button>
            {(saveStatus !== "saved" || timer) && <p className="muted">Finish or discard your timer and wait for your changes to save before signing out.</p>}
            {accountError && <p role="alert" className="account-error">{accountError}</p>}
            <button className="secondary-button" type="button" disabled={saveStatus !== "saved" || !!timer} onClick={async () => {
              const result = await accountClient!.auth.signOut();
              if (result.error) setAccountError(result.error.message);
              else {
                try {
                  localStorage.removeItem(`todaily-account-v1:${account.id}`);
                  localStorage.removeItem(timerKey);
                } catch { /* Signing out still clears Supabase authentication. */ }
              }
            }}>Sign out</button>
          </form>
        </Modal>
      )}
      {dialog?.type === "about" && (
        <Modal
          title="Your own little corner."
          eyebrow="WELCOME TO DAILY.FM"
          onClose={close}
        >
          <div className="about-copy">
            <Sprout size={40} strokeWidth={1} />
            <p>A quiet place to leave evidence of a life in progress.</p>
            <p>
              <strong>Do</strong> is for things you move forward.{" "}
              <strong>Be</strong> is for experiences that make you feel like
              you.
            </p>
            {account && <p className="muted">
              Your tasks, completed sessions, and check-ins are saved to your private account. Changes save automatically.
            </p>}
            <button className="primary-button" onClick={close}>
              A little, every day.
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
