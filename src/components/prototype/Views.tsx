"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Compass,
  Feather,
  Footprints,
  Heart,
  Leaf,
  MapPin,
  Moon,
  Palette,
  Play,
  Plus,
  Quote,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import {
  Activity,
  Area,
  Challenge,
  ChallengeCompletion,
  Project,
  PrototypeState,
  Task,
  TimerSession,
  WeeklyInsight,
} from "@/lib/prototype/types";
import { dateKey, duration, prettyDate, relativeDay } from "@/lib/prototype/seed";
import { chronologicalActivities, displayTime } from "@/lib/prototype/sessions";
import { Empty, SectionHeading } from "./UI";
import Illustration from "./Illustration";

function ActivityTime({ activity }: { activity: Activity }) {
  const { startedAt, endedAt, recordedAt } = activity;
  const spansDays = startedAt && endedAt && dateKey(new Date(startedAt)) !== dateKey(new Date(endedAt));
  const time = (value: string) => <time dateTime={value}>{spansDays ? `${prettyDate(dateKey(new Date(value)))} · ` : ""}{displayTime(value)}</time>;
  return <p className="activity-time">{startedAt
    ? <>{time(startedAt)}{endedAt ? <> — {time(endedAt)}</> : " · End time not recorded"}</>
    : recordedAt ? <>Logged at {time(recordedAt)}</> : "Time not recorded"}</p>;
}

export function ActivityRows({ activities, sessions = [] }: { activities: Activity[]; sessions?: TimerSession[] }) {
  if (!activities.length)
    return (
      <Empty>A little breathing room. There’s nothing logged here yet.</Empty>
    );
  return (
    <div className="activity-list">
      {chronologicalActivities(activities, sessions).map((a) => (
        <article className="activity-row" key={a.id}>
          <span className={`activity-symbol ${a.area}`}>
            {a.area === "do" ? (
              <Feather size={15} />
            ) : a.category === "Move" ? (
              <Footprints size={16} />
            ) : (
              <Leaf size={16} />
            )}
          </span>
          <div>
            <h3>{a.title}</h3>
            <p>
              {a.category}
              {a.distanceKm !== undefined ? ` · ${a.distanceKm} km` : ""}
              {a.minutes > 0 ? ` · ${duration(a.minutes)}` : ""}
            </p>
            <ActivityTime activity={a} />
            {a.note && <p className="activity-note">“{a.note}”</p>}
          </div>
          <span className={`area-label ${a.area}`}>
            {a.area === "do" ? "Do" : "Be"}
          </span>
        </article>
      ))}
    </div>
  );
}
export function TaskList({
  tasks,
  onToggle,
  onFocus,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
}) {
  return (
    <div className="task-list">
      {tasks.map((t) => (
        <div
          className={`task-row ${t.completed ? "completed" : ""}`}
          key={t.id}
        >
          <button
            className="task-check"
            aria-label={`${t.completed ? "Reopen" : "Complete"} ${t.title}`}
            aria-pressed={t.completed}
            onClick={() => onToggle(t.id)}
          >
            {t.completed && <Check size={13} />}
          </button>
          <div>
            <span>{t.title}</span>
            <small>{t.category}</small>
          </div>
          {!t.completed && (
            <button
              className="task-play"
              aria-label={`Focus on ${t.title}`}
              onClick={() => onFocus(t.id)}
            >
              <Play size={14} />
            </button>
          )}
        </div>
      ))}
      {!tasks.length && (
        <Empty>A fresh page. Add something you want to make time for.</Empty>
      )}
    </div>
  );
}
export function PlanCard({
  area,
  tasks,
  onToggle,
  onFocus,
  onNew,
  onCategory,
}: {
  area: Area;
  tasks: Task[];
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
  onNew: () => void;
  onCategory: (category: string) => void;
}) {
  return (
    <section className="card plan-card">
      <SectionHeading
        eyebrow={
          area === "do" ? "A LITTLE INTENTION" : "A LIFE OUTSIDE THE LIST"
        }
        title={area === "do" ? "One small step." : "Make room for life."}
        action="Add a task"
        onAction={onNew}
      />
      {area === "be" && (
        <div className="category-strip">
          {[
            { label: "Move", icon: Footprints },
            { label: "Learn", icon: BookOpen },
            { label: "Create", icon: Palette },
            { label: "Explore", icon: Compass },
            { label: "People", icon: Users },
            { label: "Reflect", icon: Feather },
            { label: "Rest", icon: Moon },
          ].map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => onCategory(label)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
      <TaskList
        tasks={tasks.filter((t) => t.area === area)}
        onToggle={onToggle}
        onFocus={onFocus}
      />
      <p className="card-footnote">
        {area === "do"
          ? "A plan is an invitation. You can change your mind."
          : "Rest counts. Joy counts. Time with people counts."}
      </p>
    </section>
  );
}
export function ReflectionCard({
  done,
  onClick,
}: {
  done: boolean;
  onClick: () => void;
}) {
  return (
    <section className="reflection-card">
      <div className="reflection-illustration">
        <Illustration kind="balance" />
      </div>
      <p className="eyebrow">A MOMENT FOR YOURSELF</p>
      <h2>{done ? "You made room for you." : "How are you, really?"}</h2>
      <p>
        {done
          ? "Your thoughts have a home here. Come back whenever you need."
          : "Not what you did. Not what’s next. Just you, right now."}
      </p>
      <button className="text-button" onClick={onClick}>
        {done ? "Revisit your check-in" : "A two-minute check-in"}
        <ArrowUpRight size={16} />
      </button>
    </section>
  );
}
export function ChallengeTeaser({
  challenge,
  completions,
  onClick,
}: {
  challenge: Challenge;
  completions: ChallengeCompletion[];
  onClick: () => void;
}) {
  const count = completions.filter(
    (c) =>
      c.challengeId === challenge.id && c.date.slice(0, 7) === challenge.month,
  ).length;
  return (
    <button className="challenge-teaser" onClick={onClick}>
      <div className="teaser-art">
        <Illustration kind="door" />
        <span className="image-pill">
          <Compass size={12} />
          {prettyDate(relativeDay(0), { month: "long" })} invitation
        </span>
      </div>
      <div className="teaser-copy">
        <span className="eyebrow">A LITTLE OUTSIDE THE EVERYDAY</span>
        <h2>{challenge.title}</h2>
        <p>{challenge.description}</p>
        <div className="challenge-progress">
          <span>
            {Array.from({ length: challenge.target }, (_, i) => (
              <i key={i} className={i < count ? "filled" : ""} />
            ))}
          </span>
          <small>
            {count} of {challenge.target} experiences
          </small>
          <ArrowUpRight size={17} />
        </div>
      </div>
    </button>
  );
}
export function ProjectsView({
  state,
  selected,
  onSelect,
  onNew,
  onMilestone,
  onToggleTask,
  onFocus,
  onNewTask,
}: {
  state: PrototypeState;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onNew: () => void;
  onMilestone: (projectId: string, id?: string, title?: string) => void;
  onToggleTask: (id: string) => void;
  onFocus: (id: string) => void;
  onNewTask: () => void;
}) {
  const project = state.projects.find((p) => p.id === selected);
  const [milestone, setMilestone] = useState("");
  const evidence = (p: Project) => {
    const acts = state.activities.filter((a) => a.projectId === p.id);
    return {
      minutes: acts.reduce((sum, a) => sum + a.minutes, 0),
      sessions: acts.filter((a) => a.kind === "session").length,
      days: new Set(
        acts.filter((a) => a.date >= relativeDay(-6)).map((a) => a.date),
      ).size,
      tasks: state.tasks.filter((t) => t.projectId === p.id && t.completed)
        .length,
      latest: [...acts].sort((a, b) => b.date.localeCompare(a.date))[0],
    };
  };
  if (project) {
    const stats = evidence(project);
    return (
      <>
        <button
          className="text-button back-link"
          onClick={() => onSelect(null)}
        >
          <ArrowLeft size={15} />
          All projects
        </button>
        <div className="page-intro">
          <p className="eyebrow">SOMETHING YOU’RE BUILDING</p>
          <h1>
            {project.name}
            <span className={`project-dot ${project.color}`} />
          </h1>
          <p>{project.description}</p>
        </div>
        <div className="project-stat-grid">
          {[
            { value: duration(stats.minutes), label: "intentional time" },
            { value: stats.sessions, label: "focus sessions" },
            { value: `${stats.days} of 7`, label: "days with activity" },
            { value: stats.tasks, label: "tasks completed" },
          ].map((s) => (
            <div className="card" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="detail-grid">
          <section className="card">
            <SectionHeading
              eyebrow="A PATH YOU DEFINE"
              title="One milestone at a time."
            />
            <p className="muted">
              {project.milestones.filter((m) => m.completed).length} of{" "}
              {project.milestones.length} milestones complete. No invented
              finish line.
            </p>
            <div className="milestone-list">
              {project.milestones.map((m) => (
                <button
                  className={m.completed ? "milestone-done" : ""}
                  onClick={() => onMilestone(project.id, m.id)}
                  key={m.id}
                >
                  {m.completed ? <Check size={17} /> : <Circle size={17} />}
                  <span>{m.title}</span>
                </button>
              ))}
            </div>
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (milestone.trim()) {
                  onMilestone(project.id, undefined, milestone.trim());
                  setMilestone("");
                }
              }}
            >
              <input
                aria-label="New milestone"
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                maxLength={100}
                placeholder="Add your own milestone"
                required
              />
              <button className="icon-button" aria-label="Add milestone">
                <Plus size={18} />
              </button>
            </form>
          </section>
          <section className="card">
            <SectionHeading
              title="The next small steps."
              action="Add task"
              onAction={onNewTask}
            />
            <TaskList
              tasks={state.tasks.filter((t) => t.projectId === project.id)}
              onToggle={onToggleTask}
              onFocus={onFocus}
            />
          </section>
        </div>
        <section className="card project-journal">
          <SectionHeading
            eyebrow="PROOF OF PROGRESS"
            title="The work, as it happened."
          />
          <ActivityRows
            activities={state.activities
              .filter((a) => a.projectId === project.id)
              .slice(-8)
              .reverse()}
          />
        </section>
      </>
    );
  }
  return (
    <>
      <div className="page-intro intro-with-action">
        <div>
          <p className="eyebrow">MAKE SOMETHING MEANINGFUL</p>
          <h1>Work in progress.</h1>
          <p>Not a percentage. A collection of things you’ve moved forward.</p>
        </div>
        <button className="primary-button" onClick={onNew}>
          <Plus size={16} />
          New project
        </button>
      </div>
      <div className="projects-grid">
        {state.projects.map((p, index) => {
          const stats = evidence(p);
          return (
            <button
              className="project-card card"
              key={p.id}
              onClick={() => onSelect(p.id)}
            >
              <div className={`project-art ${p.color}`}>
                <span>0{index + 1}</span>
                <div
                  className={`project-glyph glyph-${index % 3}`}
                  aria-hidden="true"
                >
                  <Illustration
                    kind={
                      index % 3 === 0
                        ? "steps"
                        : index % 3 === 1
                          ? "orbit"
                          : "door"
                    }
                  />
                </div>
                <ArrowUpRight size={20} />
              </div>
              <div className="project-copy">
                <h2>{p.name}</h2>
                <p>{p.description}</p>
                <div className="project-evidence">
                  <strong>
                    {duration(stats.minutes)}
                    <small>focused</small>
                  </strong>
                  <strong>
                    {stats.sessions}
                    <small>sessions</small>
                  </strong>
                  <strong>
                    {stats.tasks}
                    <small>tasks done</small>
                  </strong>
                </div>
                <div className="project-last">
                  <span className={`project-dot ${p.color}`} />
                  Active {stats.days} of the last 7 days
                </div>
                <p className="last-note">
                  {stats.latest
                    ? `Last: ${stats.latest.title}`
                    : "Your first step is still ahead."}
                </p>
                <div className="project-milestones">
                  {p.milestones.length
                    ? `${p.milestones.filter((m) => m.completed).length} of ${p.milestones.length} milestones`
                    : "Your own path, your own pace"}
                  <ChevronRight size={15} />
                </div>
              </div>
            </button>
          );
        })}
        <button className="new-project-card" onClick={onNew}>
          <Plus size={28} strokeWidth={1} />
          <h2>Room for a new idea.</h2>
          <p>It doesn’t need a perfect plan.</p>
        </button>
      </div>
      <blockquote className="editorial-note">
        <Quote size={42} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <span className="eyebrow">A little perspective</span>
          <p>Progress is easier to see when you leave a little evidence behind.</p>
        </div>
        <img
          className="quote-illustration"
          src="/illustrations/perspective-planet.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          loading="lazy"
          decoding="async"
        />
      </blockquote>
    </>
  );
}
export function MemoriesView({
  state,
  onNew,
  onChallenge,
  onCompletion,
  onMemory,
}: {
  state: PrototypeState;
  onNew: () => void;
  onChallenge: (id: string) => void;
  onCompletion: (id: string) => void;
  onMemory: (id: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const entries = [...state.completions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(
      (c) =>
        filter === "All" ||
        state.challenges.find((ch) => ch.id === c.challengeId)?.category ===
          filter,
    );
  const current = state.challenges.filter(
    (c) => c.month === relativeDay(0).slice(0, 7),
  );
  return (
    <>
      <div className="page-intro intro-with-action">
        <div>
          <p className="eyebrow">A LIFE THAT’S BEING LIVED</p>
          <h1>
            Little firsts.
            <br />
            <em>Lasting memories.</em>
          </h1>
          <p>Go somewhere. Try something. Keep a piece of it.</p>
        </div>
        <button className="secondary-button" onClick={onNew}>
          <Plus size={16} />
          New invitation
        </button>
      </div>
      <SectionHeading
        eyebrow={prettyDate(relativeDay(0), {
          month: "long",
          year: "numeric",
        }).toUpperCase()}
        title="A little outside the everyday."
      />
      <div className="challenge-grid">
        {current.map((c) => {
          const count = state.completions.filter(
            (x) => x.challengeId === c.id && x.date.slice(0, 7) === c.month,
          ).length;
          return (
            <article className="card challenge-card" key={c.id}>
              <span
                className={`challenge-category ${c.category.toLowerCase()}`}
              >
                {c.category === "Explore" ? (
                  <Compass size={14} />
                ) : c.category === "Build" ? (
                  <Feather size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                {c.category}
              </span>
              <button className="plain-title" onClick={() => onChallenge(c.id)}>
                <h2>{c.title}</h2>
              </button>
              <p>{c.description}</p>
              <div className="challenge-progress">
                <span>
                  {Array.from({ length: c.target }, (_, i) => (
                    <i key={i} className={i < count ? "filled" : ""} />
                  ))}
                </span>
                <small>
                  {count} of {c.target} experiences
                </small>
              </div>
              <button
                className="text-button"
                onClick={() => onCompletion(c.id)}
              >
                {count >= c.target
                  ? "Keep another memory"
                  : "Add an experience"}
                <Plus size={15} />
              </button>
            </article>
          );
        })}
      </div>
      <div className="gallery-heading">
        <div>
          <p className="eyebrow">YOUR MEMORY ARCHIVE</p>
          <h2>The days that stayed.</h2>
        </div>
        <div className="filter-tabs" aria-label="Filter memories">
          {["All", "Explore", "Build", "Stretch"].map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="memory-grid">
        {entries.map((c) => (
          <button
            key={c.id}
            className="memory-card"
            onClick={() => onMemory(c.id)}
          >
            <span className="memory-category">
              {state.challenges.find((ch) => ch.id === c.challengeId)?.category || "A first"}
            </span>
            <p className="eyebrow">{prettyDate(c.date)}</p>
            <h3>{c.title}</h3>
            <p className="memory-note">{c.note}</p>
            <span className="memory-location">
              <MapPin size={12} />
              {c.location || "A little outside the everyday"}
              <ArrowUpRight size={15} />
            </span>
          </button>
        ))}
      </div>
      {!entries.length && (
        <Empty>Room for a first. Your memories will find a home here.</Empty>
      )}
      <div className="archive-summary">
        <div className="archive-year">
          <span className="year-echo" aria-hidden="true">{new Date().getFullYear()}</span>
          <span>{new Date().getFullYear()}</span>
        </div>
        <div className="archive-stats">
          <p>
            <strong>{state.completions.length}</strong> moments kept
          </p>
          <p>
            <strong>
              {
                new Set(
                  state.completions
                    .filter((c) => c.location)
                    .map((c) => c.location),
                ).size
              }
            </strong>{" "}
            places remembered
          </p>
        </div>
      </div>
    </>
  );
}
export function InsightsView({
  state,
  onCheckIn,
}: {
  state: PrototypeState;
  onCheckIn: () => void;
}) {
  const recent = state.activities.filter(
    (a) => a.date >= relativeDay(-6) && a.date <= relativeDay(0),
  );
  const time = recent.reduce((sum, a) => sum + a.minutes, 0);
  const groups = recent.reduce<Record<string, number>>((all, a) => {
    all[a.category] = (all[a.category] || 0) + a.minutes;
    return all;
  }, {});
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = relativeDay(i - 6);
    const acts = recent.filter((a) => a.date === date);
    return {
      date,
      do: acts
        .filter((a) => a.area === "do")
        .reduce((s, a) => s + a.minutes, 0),
      be: acts
        .filter((a) => a.area === "be")
        .reduce((s, a) => s + a.minutes, 0),
    };
  });
  const max = Math.max(60, ...days.map((d) => d.do + d.be));
  const portfolio = recent.filter((a) => a.projectId === "portfolio");
  const checkIns = state.checkIns.filter((c) => c.date >= relativeDay(-6));
  const insights: WeeklyInsight[] = [
    {
      id: "i1",
      eyebrow: "MORE THAN IT FELT LIKE",
      title: `${recent.length} little pieces of evidence.`,
      body: `You made room for ${recent.length} meaningful activities across ${new Set(recent.map((a) => a.date)).size} days. When a week feels like a blur, these small details tell a different story.`,
    },
    {
      id: "i2",
      eyebrow: "SOMETHING IS TAKING SHAPE",
      title: "The work is adding up.",
      body: `You returned to your portfolio on ${new Set(portfolio.map((a) => a.date)).size} days, giving it ${duration(portfolio.reduce((s, a) => s + a.minutes, 0))} of attention. That’s a real body of work, one session at a time.`,
    },
    {
      id: "i3",
      eyebrow: "A LITTLE CURIOSITY",
      title:
        checkIns.length > 1
          ? "Make room to notice."
          : "How did it feel to be you?",
      body:
        checkIns.length > 1
          ? `You checked in on ${checkIns.length} days this week. Your mood and movement can be useful things to notice together, without assuming one caused the other.`
          : "A few gentle check-ins can help you notice what leaves you feeling a little more like yourself. No analysis needed. Start with today.",
    },
  ];
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">
          <span className="live-dot" />
          The last seven days ·{" "}
          {prettyDate(relativeDay(-6), { month: "short", day: "numeric" })} —{" "}
          {prettyDate(relativeDay(0), { month: "short", day: "numeric" })}
        </p>
        <h1>A week, in perspective.</h1>
        <p>Sometimes you need to step back to see what’s been growing.</p>
      </div>
      <div className="insights-top">
        <section className="card weekly-chart">
          <SectionHeading title="Time, intentionally spent." />
          <div className="weekly-total">
            {duration(time)}
            <span>made room for this week</span>
          </div>
          <div className="week-bars">
            {days.map((d) => (
              <div className="week-bar-column" key={d.date}>
                <div className="bar-space">
                  <div
                    className="bar-stack"
                    style={{ height: `${((d.do + d.be) / max) * 100}%` }}
                    title={`${prettyDate(d.date)}: Do ${duration(d.do)}, Be ${duration(d.be)}`}
                  >
                    <div className="bar-do" style={{ flex: d.do }} />
                    <div className="bar-be" style={{ flex: d.be }} />
                  </div>
                </div>
                <span>{prettyDate(d.date, { weekday: "short" })}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>
              <i className="bar-do" />
              Do · meaningful output
            </span>
            <span>
              <i className="bar-be" />
              Be · a life well lived
            </span>
          </div>
        </section>
        <section className="card time-breakdown">
          <SectionHeading
            eyebrow="WHERE YOUR ATTENTION WENT"
            title="A little of everything."
          />
          {sorted.map(([category, minutes]) => (
            <div key={category}>
              <span>{category}</span>
              <strong>{duration(minutes)}</strong>
              <i
                style={{ width: `${(minutes / (sorted[0]?.[1] || 1)) * 100}%` }}
              />
            </div>
          ))}
          {!sorted.length && (
            <Empty>Your intentional time will appear here.</Empty>
          )}
        </section>
      </div>
      <div className="section-heading notes-heading">
        <div>
          <p className="eyebrow">PATTERN NOTES</p>
          <h2>A few things worth noticing.</h2>
        </div>
        <span className="sample-label">Simulated insights · local history</span>
      </div>
      <div className="insight-grid">
        {insights.map((insight, i) => (
          <article className="insight-card" key={insight.id}>
            <span className="insight-number">0{i + 1}</span>
            <p className="eyebrow">{insight.eyebrow}</p>
            <h2>{insight.title}</h2>
            <p>{insight.body}</p>
            {i === 2 && (
              <button className="text-button" onClick={onCheckIn}>
                A moment to check in
                <ArrowUpRight size={16} />
              </button>
            )}
          </article>
        ))}
      </div>
      <blockquote className="editorial-note">
        <Quote size={42} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <span className="eyebrow">A little perspective</span>
          <p>Patterns are invitations to get curious. They’re never a verdict.</p>
        </div>
        <img
          className="quote-illustration"
          src="/illustrations/perspective-planet.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          loading="lazy"
          decoding="async"
        />
      </blockquote>
    </>
  );
}
