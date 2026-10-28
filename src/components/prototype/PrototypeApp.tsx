"use client";
import { useEffect, useRef, useState } from "react";
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
} from "@/lib/prototype/types";
import {
  duration,
  momentum,
  prettyDate,
  relativeDay,
  streak,
} from "@/lib/prototype/seed";

import ActivityGrid from "./ActivityGrid";
import QuoteCard from "./QuoteCard";
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
};
const navigation: { view: View; label: string; icon: typeof Grid2X2 }[] = [
  { view: "today", label: "Today", icon: Grid2X2 },
  { view: "projects", label: "Projects", icon: Feather },
  { view: "reflect", label: "Reflect", icon: Leaf },
  { view: "insights", label: "Weekly notes", icon: BookOpen },
];
const TIMER_KEY = "timerfm-active-timer-v1";
export default function PrototypeApp(props: { initialView?: View; initialProject?: string | null }) {
  return <AccountGate>{(account) => <Workspace key={account?.id || "demo"} {...props} account={account} />}</AccountGate>;
}
function Workspace({
  initialView = "today",
  initialProject = null,
  account,
}: {
  initialView?: View;
  initialProject?: string | null;
  account: AccountUser | null;
}) {
  const { state, setState, ready: dataReady, status: saveStatus, error: saveError, retry, loadCloud } = useWorkspace(account);
  const hasConflict = saveStatus === "conflict";
  const timerKey = account ? `${TIMER_KEY}:${account.id}` : TIMER_KEY;
  const [accountError, setAccountError] = useState("");
  const [ready, setReady] = useState(false),
    [area, setArea] = useState<Area>("do");
  const [view, setView] = useState<View>(initialView),
    [selectedProject, setSelectedProject] = useState<string | null>(
      initialProject,
    );
  const [dialog, setDialog] = useState<Dialog | null>(null),
    [toast, setToast] = useState("");
  const [timer, setTimer] = useState<ActiveTimer | null>(null),
    [now, setNow] = useState(Date.now());
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
      const stored = JSON.parse(localStorage.getItem(timerKey) || "null");
      if (
        stored &&
        (!stored.taskId || state.tasks.some((t) => t.id === stored.taskId)) &&
        typeof stored.elapsed === "number" &&
        (stored.runningSince === null ||
          typeof stored.runningSince === "number")
      )
        setTimer(stored);
    } catch {
      /* A fresh timer is fine. */
    }
    const restoreLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("view");
      setView(
        navigation.some((n) => n.view === requested)
          ? (requested as View)
          : initialView,
      );
      setSelectedProject(
        params.get("project") || (requested ? null : initialProject),
      );
      setArea(params.get("area") === "be" ? "be" : "do");
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
    if (!timer?.runningSince) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
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
  const seconds = timer
    ? timer.elapsed +
      (timer.runningSince
        ? Math.max(0, Math.floor((now - timer.runningSince) / 1000))
        : 0)
    : 0;
  const activeTask = state.tasks.find((t) => t.id === timer?.taskId);
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
    setView(next);
    setArea(nextArea);
    setSelectedProject(project);
    setMobileMenu(false);
    const params = new URLSearchParams({ view: next, area: nextArea });
    if (project) params.set("project", project);
    window.history.pushState(null, "", `/?${params}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function startTimer(id?: string) {
    if (timer && id && timer.taskId !== id) {
      setToast("Finish your current session first. One thing at a time.");
      navigate("today");
      return;
    }
    const time = Date.now();
    setNow(time);
    setTimer((current) =>
      current
        ? { ...current, endedAt: undefined, runningSince: current.runningSince || time }
        : {
            taskId: id,
            area: state.tasks.find((task) => task.id === id)?.area || area,
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
    setNow(time);
    setTimer((current) =>
      current
        ? {
            ...current,
            elapsed:
              current.elapsed +
              (current.runningSince
                ? Math.max(0, Math.floor((time - current.runningSince) / 1000))
                : 0),
            runningSince: null,
          }
        : null,
    );
  }
  function stopTimer() {
    pauseTimer();
    const endedAt = new Date().toISOString();
    setTimer((current) => current ? { ...current, endedAt } : null);
    setDialog({ type: "session" });
  }
  function saveSession(details: SessionDetails) {
    if (!timer) return;
    const elapsed = Math.max(1, seconds);
    setState((current) => finishSession(current, timer, elapsed, details, uid));
    setTimer(null);
    announce(account ? `Recorded ${clock(elapsed)} of focus. Saving to your account…` : `Saved ${clock(elapsed)} of focus on this device.`, "session");
  }
  function toggleTask(id: string) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    if (timer?.taskId === id && !task.completed) {
      setToast("Save your focus session before completing this task.");
      return;
    }
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
      activities: task.completed
        ? s.activities.filter((a) => a.id !== `task-${id}`)
        : [
            ...s.activities,
            {
              id: `task-${id}`,
              title: task.title,
              recordedAt: new Date().toISOString(),
              date: today,
              area: task.area,
              category: task.category,
              kind: "task",
              minutes: 0,
              projectId: task.projectId,
              source: "manual",
            },
          ],
    }));
    if (!task.completed) celebrate("task", `Completed “${task.title}”. One small step forward.`);
    else {
      setCelebration(null);
      setToast("A little more room to work on this.");
    }
  }
  function updateMilestone(projectId: string, id?: string, title?: string) {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;
    const milestone = project.milestones.find((m) => m.id === id);
    if (id && !milestone) return;
    if (!id && !title?.trim()) return;
    setState((s) => {
      const project = s.projects.find((p) => p.id === projectId);
      if (!project) return s;
      const milestone = project.milestones.find((m) => m.id === id);
      const activities = !milestone
        ? s.activities
        : milestone.completed
          ? s.activities.filter((a) => a.id !== `milestone-${id}`)
          : [
              ...s.activities,
              {
                id: `milestone-${id}`,
                title: `${project.name}: ${milestone.title}`,
                date: today,
                area: "do" as const,
                category: project.name,
                kind: "task" as const,
                minutes: 0,
                projectId,
                source: "manual" as const,
              },
            ];
      return {
        ...s,
        activities,
        projects: s.projects.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                milestones: id
                  ? p.milestones.map((m) =>
                      m.id === id ? { ...m, completed: !m.completed } : m,
                    )
                  : [
                      ...p.milestones,
                      { id: uid(), title: title!, completed: false },
                    ],
              },
        ),
      };
    });
    if (!id) celebrate("task", `Milestone added to ${project.name}. A next step to aim for.`);
    else if (milestone && !milestone.completed) celebrate("task", `Milestone complete: ${milestone.title}.`);
    else {
      setCelebration(null);
      setToast("Milestone reopened. Take it at your pace.");
    }
  }
  function addActivity(activity: Activity) {
    setState((s) => ({ ...s, activities: [...s.activities, { ...activity, recordedAt: new Date().toISOString() }] }));
    announce(`Logged “${activity.title}”. A little piece of your day, kept.`);
  }
  const selectedChallenge = state.challenges.find((c) => c.id === dialog?.id);
  const selectedMemory = state.completions.find((c) => c.id === dialog?.id);
  const selectedDay = dialog?.type === "day" ? dialog.id || today : today;
  const dayActivities = state.activities.filter((a) => a.date === selectedDay);
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
              className={`nav-item ${view === next ? "active" : ""}`}
              aria-current={view === next ? "page" : undefined}
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
          {state.projects.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => navigate("projects", p.id)}
              className={
                selectedProject === p.id && view === "projects"
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
          {!account && <button
            className="prototype-label"
            onClick={() => setDialog({ type: "about" })}
          >
            <span />
            Demo · on this device
            <ArrowUpRight size={12} />
          </button>}
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
              {navigation.find((n) => n.view === view)?.label}
            </span>
            <span className="mobile-brand">do.daily</span>
          </div>
          <div className="area-switch" aria-label="Choose an area">
            <button
              className={area === "do" ? "selected" : ""}
              aria-pressed={area === "do"}
              onClick={() => {
                navigate("today", null, "do");
              }}
            >
              <BriefcaseBusiness size={14} />
              Do<span>make things happen</span>
            </button>
            <button
              className={area === "be" ? "selected" : ""}
              aria-pressed={area === "be"}
              onClick={() => {
                navigate("today", null, "be");
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
          {(!account || saveStatus === "error") && <div className={`account-save-status ${saveStatus === "error" ? "has-error" : ""}`} role="status" aria-live="polite">
            {account ? <>
              <span className="live-dot" />
              <span>Not saved to your account. Keep this tab open.</span>
              {saveStatus === "error" && <button className="text-button" onClick={retry}>Retry save</button>}
              {saveError && <span>{saveError}</span>}
            </> : <>Demo mode · Changes stay in this browser. Connect Supabase to use a real account.{saveError && <span>{saveError}</span>}</>}
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
                  activities={state.activities}
                  onDay={(date) => setDialog({ type: "day", id: date })}
                  onMomentum={() => setDialog({ type: "momentum" })}
                />
                <div ref={focusRef}>
                  <TimerCard
                    clockRef={clockRef}
                    tasks={state.tasks}
                    area={area}
                    timer={timer}
                    seconds={seconds}
                    onStart={startTimer}
                    onPause={pauseTimer}
                    onStop={stopTimer}
                  />
                </div>
              </div>
              <div className="dashboard-grid second-row">
                <PlanCard
                  area={area}
                  tasks={state.tasks}
                  onToggle={toggleTask}
                  onFocus={focusTask}
                  onNew={() => setDialog({ type: "task" })}
                  onCategory={(category) =>
                    setDialog({ type: "activity", category })
                  }
                />
                <ReflectionCard
                  done={!!checkIn}
                  onClick={() => setDialog({ type: "checkin" })}
                />
              </div>
              <div className="dashboard-grid third-row">
                <section className="card today-story">
                  <SectionHeading
                    eyebrow="YOU SHOWED UP TODAY"
                    title="Here’s what happened."
                    action="Your day"
                    onAction={() => setDialog({ type: "day", id: today })}
                  />
                  <ActivityRows
                    activities={chronologicalActivities(todays.filter((a) => a.area === area), state.sessions).slice(-4)}
                  />
                  <button
                    className="text-button story-add"
                    onClick={() => setDialog({ type: "activity" })}
                  >
                    <Plus size={15} />
                    There was something else…
                  </button>
                </section>
                <QuoteCard compact />
              </div>
            </>
          )}
          {view === "projects" && (
            <ProjectsView
              state={state}
              selected={selectedProject}
              onSelect={(id) => navigate("projects", id)}
              onNew={() => setDialog({ type: "project" })}
              onMilestone={updateMilestone}
              onToggleTask={toggleTask}
              onFocus={focusTask}
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
            className={view === next ? "active" : ""}
            aria-current={view === next ? "page" : undefined}
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
            {activeTask?.title || "Focus session"}
            <strong>{clock(seconds)}</strong>
          </button>
          <button
            className="icon-button"
            aria-label={timer.runningSince ? "Pause session" : "Resume session"}
            onClick={() =>
              timer.runningSince ? pauseTimer() : startTimer(timer.taskId)
            }
          >
            {timer.runningSince ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="text-button" onClick={stopTimer}>
            Finish
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
      {dialog?.type === "task" && (
        <Modal
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
            onSave={(project) => {
              setState((s) => ({ ...s, projects: [...s.projects, project] }));
              navigate("projects", project.id);
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
              : "Nothing recorded. A quiet day belongs in your story, too."}
          </p>
          <ActivityRows activities={dayActivities} sessions={state.sessions} />
          {dayCheckIn && (
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
          title="What changed?"
          eyebrow="A SESSION, WELL SPENT"
          onClose={close}
        >
          <SessionFinishForm
            timer={timer}
            seconds={seconds}
            tasks={state.tasks}
            projects={state.projects}
            initialArea={area}
            onSave={saveSession}
            onDiscard={() => {
              setTimer(null);
              announce("A little breathing room. Session discarded.", false);
            }}
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
              {momentum(state.activities)}
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
                    state.activities
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
              <b>{streak(state.activities)} days showing up</b>
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
            <p className="muted">
              {account ? "Your tasks, completed sessions, check-ins, and memories are saved to your private account. A running timer stays on the device where you started it. Changes save automatically; keep this tab open if a save error appears." : "This demo starts with sample history. Changes are saved only in this browser. Real accounts start fresh once Supabase is connected; demo history is never imported automatically."}
            </p>
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
