"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import {
  Activity,
  Area,
  Challenge,
  ChallengeCompletion,
  DailyCheckIn,
  Project,
  Task,
} from "@/lib/prototype/types";
import { relativeDay } from "@/lib/prototype/seed";
export const uid = () => crypto.randomUUID();
const categories = [
  "Move",
  "Learn",
  "Create",
  "Explore",
  "People",
  "Reflect",
  "Rest",
];
export function TaskForm({
  area: initialArea,
  projects,
  initialProject,
  onSave,
}: {
  area: Area;
  projects: Project[];
  initialProject?: string | null;
  onSave: (task: Task) => void;
}) {
  const [area, setArea] = useState<Area>(initialProject ? "do" : initialArea),
    [projectId, setProjectId] = useState(initialProject || "");
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSave({
          id: uid(),
          title: String(f.get("title")).trim(),
          area,
          projectId: projectId || undefined,
          category:
            area === "be"
              ? String(f.get("category"))
              : projects.find((p) => p.id === projectId)?.name || "Personal",
          completed: false,
        });
      }}
    >
      <p className="muted">
        Something small enough to begin. You can make time for it later.
      </p>
      <label>
        What would you like to do?
        <input
          name="title"
          required
          maxLength={100}
          placeholder="Give the case study a clearer story"
        />
      </label>
      <label>
        A little output, or a little experience?
        <select
          value={area}
          onChange={(e) => {
            setArea(e.target.value as Area);
            setProjectId("");
          }}
        >
          <option value="do">Do · move something forward</option>
          <option value="be">Be · make room for life</option>
        </select>
      </label>
      {area === "do" ? (
        <label>
          Project <span className="optional">optional</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Just for me</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label>
          Category
          <select name="category">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      )}
      <button className="primary-button" type="submit">
        Make a little plan <ArrowRight size={16} />
      </button>
    </form>
  );
}
export function ActivityForm({
  area,
  initialCategory,
  projects,
  onSave,
}: {
  area: Area;
  initialCategory?: string;
  projects: Project[];
  onSave: (activity: Activity) => void;
}) {
  const [category, setCategory] = useState(
    initialCategory || (area === "be" ? "Move" : "Portfolio"),
  );
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const project = projects.find((p) => p.name === category);
        onSave({
          id: uid(),
          area,
          kind: "activity",
          category,
          title: String(f.get("title")).trim(),
          date: String(f.get("date")),
          minutes: Number(f.get("minutes")),
          distanceKm: f.get("distance") ? Number(f.get("distance")) : undefined,
          note: String(f.get("note")).trim(),
          projectId: project?.id,
          source: "manual",
        });
      }}
    >
      <p className="muted">The little things count, too.</p>
      <label>
        What did you make time for?
        <input
          name="title"
          required
          maxLength={100}
          placeholder={
            category === "Move"
              ? "A long walk with Milo"
              : "A little something that mattered"
          }
        />
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {(area === "be"
            ? categories
            : [...projects.map((p) => p.name), "Learning", "Personal"]
          ).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          Minutes
          <input
            name="minutes"
            type="number"
            min="1"
            max="1440"
            required
            defaultValue="30"
          />
        </label>
        <label>
          Date
          <input
            name="date"
            type="date"
            required
            max={relativeDay(0)}
            defaultValue={relativeDay(0)}
          />
        </label>
      </div>
      {category === "Move" && (
        <label>
          Distance, km{" "}
          <span className="optional">optional · entered manually</span>
          <input
            name="distance"
            type="number"
            min="0"
            max="500"
            step="0.1"
            placeholder="2.8"
          />
        </label>
      )}
      <label>
        A detail to remember <span className="optional">optional</span>
        <textarea
          name="note"
          rows={2}
          maxLength={600}
          placeholder="Took the long way home."
        />
      </label>
      <button className="primary-button" type="submit">
        Keep this moment <ArrowRight size={16} />
      </button>
    </form>
  );
}
export function CheckInForm({
  existing,
  onSave,
}: {
  existing?: DailyCheckIn;
  onSave: (checkIn: DailyCheckIn) => void;
}) {
  const [mood, setMood] = useState(existing?.mood || 6);
  const descriptions = [
    "A difficult day",
    "A difficult day",
    "A little low",
    "A little low",
    "Somewhere in between",
    "Somewhere in between",
    "Doing okay",
    "Feeling good",
    "Feeling good",
    "Feeling light",
    "Feeling light",
  ];
  return (
    <form
      className="form checkin-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget),
          date = relativeDay(0);
        onSave({
          id: existing?.id || uid(),
          date,
          mood,
          movedForward: String(f.get("forward")).trim(),
          reflection: {
            id: existing?.reflection.id || uid(),
            date,
            text: String(f.get("mind")).trim(),
          },
        });
      }}
    >
      <div>
        <label htmlFor="mood">
          01 <span>How are you today?</span>
        </label>
        <div className="mood-value">
          <span>{mood < 4 ? "◡" : mood < 8 ? "◡" : "☺"}</span>
          <p>
            {descriptions[mood]}
            <small>{mood} out of 10</small>
          </p>
        </div>
        <input
          aria-label="Mood"
          id="mood"
          type="range"
          min="1"
          max="10"
          value={mood}
          onChange={(e) => setMood(Number(e.target.value))}
        />
        <div className="range-labels">
          <span>A little low</span>
          <span>Feeling light</span>
        </div>
      </div>
      <label>
        02 <span>What moved forward today?</span>
        <textarea
          name="forward"
          rows={2}
          maxLength={600}
          defaultValue={existing?.movedForward}
          placeholder="A small step is still a step."
        />
      </label>
      <label>
        03 <span>What is occupying your mind?</span>
        <textarea
          name="mind"
          rows={3}
          maxLength={1000}
          defaultValue={existing?.reflection.text}
          placeholder="Leave a thought here. No need to solve it."
        />
      </label>
      <p className="form-hint">Only your mood is needed. The words can wait.</p>
      <button className="primary-button" type="submit">
        A moment, kept <Check size={16} />
      </button>
    </form>
  );
}
export function ProjectForm({
  onSave,
}: {
  onSave: (project: Project) => void;
}) {
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSave({
          id: uid(),
          name: String(f.get("name")).trim(),
          description: String(f.get("description")).trim(),
          color: "sage",
          milestones: [],
        });
      }}
    >
      <p className="muted">
        A place for something you want to bring into the world.
      </p>
      <label>
        Project name
        <input
          name="name"
          required
          maxLength={70}
          placeholder="A small, good idea"
        />
      </label>
      <label>
        What is it about?
        <textarea
          name="description"
          maxLength={200}
          rows={3}
          placeholder="It doesn’t need a perfect plan."
        />
      </label>
      <button className="primary-button">
        Create a space <ArrowRight size={16} />
      </button>
    </form>
  );
}
export function ChallengeForm({
  onSave,
}: {
  onSave: (challenge: Challenge) => void;
}) {
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSave({
          id: uid(),
          title: String(f.get("title")).trim(),
          description: String(f.get("description")).trim(),
          category: f.get("category") as Challenge["category"],
          target: Number(f.get("target")),
          month: relativeDay(0).slice(0, 7),
        });
      }}
    >
      <label>
        A little invitation
        <input
          name="title"
          required
          maxLength={100}
          placeholder="Try something with your hands"
        />
      </label>
      <label>
        Category
        <select name="category">
          <option>Explore</option>
          <option>Build</option>
          <option>Stretch</option>
        </select>
      </label>
      <label>
        What would make it meaningful?
        <textarea
          name="description"
          rows={2}
          maxLength={300}
          placeholder="Something outside my usual routine."
        />
      </label>
      <label>
        How many experiences?
        <input
          type="number"
          name="target"
          min="1"
          max="31"
          required
          defaultValue="3"
        />
      </label>
      <button className="primary-button">
        Set an intention <ArrowRight size={16} />
      </button>
    </form>
  );
}
export function CompletionForm({
  challenge,
  onSave,
}: {
  challenge: Challenge;
  onSave: (completion: ChallengeCompletion) => void;
}) {
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSave({
          id: uid(),
          challengeId: challenge.id,
          title: String(f.get("title")).trim(),
          photo: "",
          photoIsSample: false,
          note: String(f.get("note")).trim(),
          date: String(f.get("date")),
          location: String(f.get("location")).trim(),
          again: f.get("again") as ChallengeCompletion["again"],
        });
      }}
    >
      <p className="muted">{challenge.title} Keep a note of the experience.</p>
      <label>
        Give this memory a name
        <input
          required
          name="title"
          maxLength={100}
          placeholder="My first climbing session"
        />
      </label>
      <label>
        A small note
        <textarea
          name="note"
          required
          rows={2}
          maxLength={600}
          placeholder="Terrible technique. Surprisingly fun."
        />
      </label>
      <div className="form-row">
        <label>
          When
          <input
            type="date"
            name="date"
            required
            min={`${challenge.month}-01`}
            max={relativeDay(0)}
            defaultValue={relativeDay(0)}
          />
        </label>
        <label>
          Where <span className="optional">optional</span>
          <input name="location" maxLength={100} placeholder="Somewhere new" />
        </label>
      </div>
      <label>
        Would you do this again?
        <select name="again">
          <option>Yes</option>
          <option>Maybe</option>
          <option>Absolutely not</option>
        </select>
      </label>
      <button className="primary-button">
        Keep the memory <ArrowRight size={16} />
      </button>
    </form>
  );
}
