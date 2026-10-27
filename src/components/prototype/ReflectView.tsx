"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Leaf, LayoutGrid, List } from "lucide-react";
import { DailyCheckIn } from "@/lib/prototype/types";
import { prettyDate, relativeDay } from "@/lib/prototype/seed";
import { filterReflections } from "@/lib/prototype/journal";
import { Empty, SectionHeading } from "./UI";
import { MoodIcon, EnergyIcon, moodLabels, energyLabels, ratingIndex } from "./ReflectionIcons";

export function GuidedJournalForm({ existing, date, onSave }: {
  existing?: DailyCheckIn; date: string; onSave: (entry: DailyCheckIn) => void;
}) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(existing?.mood ?? 6);
  const [energy, setEnergy] = useState(existing?.energy ?? 6);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  return <form className="form journal-form" onSubmit={(event) => {
    event.preventDefault();
    if (step !== 1) { setStep(step + 1); return; }
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) || "").trim();
    onSave({ ...existing, id: existing?.id || crypto.randomUUID(), date, mood, energy,
      movedForward: text("forward"), updatedAt: new Date().toISOString(),
      reflection: { id: existing?.reflection.id || crypto.randomUUID(), date, text: text("mind") },
    });
  }}>
    <div className="journal-progress" aria-label={`Step ${step + 1} of 2`}>
      {["Arrive", "Look back"].map((name, index) => <span key={name} className={index <= step ? "active" : ""}>{index + 1} · {name}</span>)}
    </div>
    <h3 ref={heading} tabIndex={-1}>{["How are you arriving?", "Make a little sense of today."][step]}</h3>
    <p className="form-hint">{prettyDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · One entry per day. Revisit it whenever you like.</p>
    <fieldset hidden={step !== 0}>
      <legend className="sr-only">Mood and energy</legend>
      <fieldset className="visual-rating"><legend>How do you feel?</legend>
        <div className="rating-options">{moodLabels.map((label, index) => <label className="rating-option" key={label}>
          <input type="radio" name="mood" value={(index + 1) * 2} checked={ratingIndex(mood) === index} onChange={() => setMood((index + 1) * 2)} />
          <span><MoodIcon index={index} /><small>{label}</small></span>
        </label>)}</div>
      </fieldset>
      <fieldset className="visual-rating"><legend>How much energy do you have?</legend>
        <div className="rating-options">{energyLabels.map((label, index) => <label className="rating-option" key={label}>
          <input type="radio" name="energy" value={(index + 1) * 2} checked={ratingIndex(energy) === index} onChange={() => setEnergy((index + 1) * 2)} />
          <span><EnergyIcon index={index} /><small>{label}</small></span>
        </label>)}</div>
      </fieldset>
      <p className="form-hint">Mood and energy can feel different. There is no right answer.</p>
    </fieldset>
    <fieldset hidden={step !== 1}>
      <legend className="sr-only">Look back</legend>
      <label>What moved forward, however small?<textarea name="forward" rows={2} maxLength={1000} defaultValue={existing?.movedForward} placeholder="Something you tried, finished, or simply showed up for." /></label>
      <label>What is occupying your mind?<textarea name="mind" rows={3} maxLength={3000} defaultValue={existing?.reflection.text} placeholder="A thought, a challenge, or something you are still carrying." /></label>
      <p className="form-hint">Both answers are optional. Keep a few words, or just how you feel.</p>
    </fieldset>
    <div className="journal-actions">
      {step > 0 && <button type="button" className="secondary-button" onClick={() => setStep(step - 1)}>Back</button>}
      {step < 1 ? <button key="continue" type="button" className="primary-button" onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></button> : <button key="save" type="submit" className="primary-button">Keep this reflection <Check size={16} /></button>}
    </div>
  </form>;
}

export default function ReflectView({ entries, onWrite }: { entries: DailyCheckIn[]; onWrite: (date: string) => void }) {
  const today = relativeDay(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [layout, setLayout] = useState<"tiles" | "lines">("tiles");
  useEffect(() => { try { if (localStorage.getItem("todaily-journal-layout") === "lines") setLayout("lines"); } catch {} }, []);
  const changeLayout = (next: "tiles" | "lines") => { setLayout(next); try { localStorage.setItem("todaily-journal-layout", next); } catch {} };
  const filtered = filterReflections(entries, from, to);
  const todayEntry = entries.find((entry) => entry.date === today);
  const invalidRange = !!from && !!to && from > to;
  return <div className="reflect-view">
    <SectionHeading eyebrow="A MOMENT FOR YOURSELF" title="Reflect." />
    <section className="journal-invitation">
      <div><p className="eyebrow"><span className="green-dot" />{prettyDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h2>{todayEntry ? "There is always room for another thought." : "Pause. Notice. Make room for you."}</h2>
        <p>A few gentle questions about how you feel and what mattered today. Two minutes is enough.</p>
        <button className="primary-button" onClick={() => onWrite(today)}>{todayEntry ? "Revisit today" : "Start today’s reflection"}<ArrowRight size={16} /></button>
      </div><Leaf size={64} strokeWidth={1} aria-hidden="true" />
    </section>
    <div className="journal-history-heading"><div><p className="eyebrow">YOUR JOURNAL</p><h2>The days, in your words.</h2></div><div className="journal-layout" role="group" aria-label="Journal layout"><button aria-label="Tiles" aria-pressed={layout === "tiles"} onClick={() => changeLayout("tiles")}><LayoutGrid size={16} />Tiles</button><button aria-label="Lines" aria-pressed={layout === "lines"} onClick={() => changeLayout("lines")}><List size={16} />Lines</button></div></div>
    <div className="journal-filters">
      <label>From<input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} /></label>
      <label>To<input type="date" value={to} min={from || undefined} max={today} onChange={(e) => setTo(e.target.value)} /></label>
      <button className="secondary-button" onClick={() => { setFrom(relativeDay(-6)); setTo(today); }}>Last 7 days</button>
      {(from || to) && <button className="text-button" onClick={() => { setFrom(""); setTo(""); }}>Clear dates</button>}
    </div>
    <p className="form-hint" role="status">{invalidRange ? "Choose an end date on or after the start date." : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"} · newest first`}</p>
    {!filtered.length && <Empty>{entries.length ? "No reflections in this date range. Try different dates." : "Your words will find a home here. Begin with how you feel today."}</Empty>}
    <div className={`journal-history journal-${layout}`}>{filtered.map((entry) => <details className="journal-entry" key={entry.id}>
      <summary><div><time dateTime={entry.date}>{prettyDate(entry.date, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</time><span className="journal-rating-preview"><span role="img" aria-label={`Mood: ${moodLabels[ratingIndex(entry.mood)]}`} title={`Mood: ${moodLabels[ratingIndex(entry.mood)]}`}><MoodIcon index={ratingIndex(entry.mood)} /></span>{entry.energy !== undefined && <span role="img" aria-label={`Energy: ${energyLabels[ratingIndex(entry.energy)]}`} title={`Energy: ${energyLabels[ratingIndex(entry.energy)]}`}><EnergyIcon index={ratingIndex(entry.energy)} /></span>}</span></div><span className="journal-read">Read <ArrowRight size={14} aria-hidden="true" /></span></summary>
      <div className="journal-entry-body">
        {[["What moved forward", entry.movedForward], ["On your mind", entry.reflection.text], [entry.dailyPrompt || "A little perspective", entry.dailyAnswer], ["Glad for today", entry.gratitude], ["For tomorrow", entry.tomorrow]].filter(([, answer]) => answer?.trim()).map(([question, answer]) => <div key={question}><h3>{question}</h3><p>{answer}</p></div>)}
        {![entry.movedForward, entry.reflection.text, entry.dailyAnswer, entry.gratitude, entry.tomorrow].some((value) => value?.trim()) && <p>A moment to check in. No words needed.</p>}
        <button className="secondary-button" onClick={() => onWrite(entry.date)}>Edit reflection</button>
      </div>
    </details>)}</div>
  </div>;
}
