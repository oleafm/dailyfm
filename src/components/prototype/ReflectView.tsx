"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { DailyCheckIn } from "@/lib/prototype/types";
import { prettyDate, relativeDay } from "@/lib/prototype/seed";
import { filterReflections, promptForDate } from "@/lib/prototype/journal";
import { Empty, SectionHeading } from "./UI";

export function GuidedJournalForm({ existing, date, onSave }: {
  existing?: DailyCheckIn; date: string; onSave: (entry: DailyCheckIn) => void;
}) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(existing?.mood ?? 5);
  const [energy, setEnergy] = useState(existing?.energy ?? 5);
  const heading = useRef<HTMLHeadingElement>(null);
  const prompt = existing?.dailyPrompt || promptForDate(date);
  useEffect(() => { heading.current?.focus(); }, [step]);
  return <form className="form journal-form" onSubmit={(event) => {
    event.preventDefault();
    if (step !== 2) { setStep(step + 1); return; }
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) || "").trim();
    onSave({ ...existing, id: existing?.id || crypto.randomUUID(), date, mood, energy,
      movedForward: text("forward"), gratitude: text("gratitude"), tomorrow: text("tomorrow"),
      dailyPrompt: prompt, dailyAnswer: text("dailyAnswer"), updatedAt: new Date().toISOString(),
      reflection: { id: existing?.reflection.id || crypto.randomUUID(), date, text: text("mind") },
    });
  }}>
    <div className="journal-progress" aria-label={`Step ${step + 1} of 3`}>
      {["Arrive", "Look back", "Carry forward"].map((name, index) => <span key={name} className={index <= step ? "active" : ""}>{index + 1} · {name}</span>)}
    </div>
    <h3 ref={heading} tabIndex={-1}>{["How are you arriving?", "Make a little sense of today.", "A softer landing for tomorrow."][step]}</h3>
    <p className="form-hint">{prettyDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · One entry per day. Revisit it whenever you like.</p>
    <fieldset hidden={step !== 0}>
      <legend className="sr-only">Mood and energy</legend>
      <label htmlFor="journal-mood">How do you feel? <strong>{mood}/10</strong></label>
      <input id="journal-mood" type="range" min="1" max="10" value={mood} onChange={(e) => setMood(Number(e.target.value))} />
      <div className="range-labels"><span>Feeling low</span><span>Feeling good</span></div>
      <label htmlFor="journal-energy">How much energy do you have? <strong>{energy}/10</strong></label>
      <input id="journal-energy" type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
      <div className="range-labels"><span>Running on empty</span><span>Full of energy</span></div>
      <p className="form-hint">Mood and energy can feel different. There is no right answer.</p>
    </fieldset>
    <fieldset hidden={step !== 1}>
      <legend className="sr-only">Look back</legend>
      <label>What moved forward, however small?<textarea name="forward" rows={2} maxLength={1000} defaultValue={existing?.movedForward} placeholder="Something you tried, finished, or simply showed up for." /></label>
      <label>What is occupying your mind?<textarea name="mind" rows={3} maxLength={3000} defaultValue={existing?.reflection.text} placeholder="A thought, a challenge, or something you are still carrying." /></label>
      <label>{prompt}<span className="optional">Today’s extra perspective · optional</span><textarea name="dailyAnswer" rows={2} maxLength={1000} defaultValue={existing?.dailyAnswer} /></label>
    </fieldset>
    <fieldset hidden={step !== 2}>
      <legend className="sr-only">Carry forward</legend>
      <label>What are you glad was part of today?<textarea name="gratitude" rows={2} maxLength={1000} defaultValue={existing?.gratitude} placeholder="A person, a small kindness, a quiet moment…" /></label>
      <label>What is one kind thing you can do for yourself tomorrow?<textarea name="tomorrow" rows={2} maxLength={1000} defaultValue={existing?.tomorrow} placeholder="Keep it small enough to feel possible." /></label>
      <p className="form-hint">All written answers are optional. This is a place to notice, without judgment. Changes are kept when you finish.</p>
    </fieldset>
    <div className="journal-actions">
      {step > 0 && <button type="button" className="secondary-button" onClick={() => setStep(step - 1)}>Back</button>}
      {step < 2 ? <button key="continue" type="button" className="primary-button" onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></button> : <button key="save" type="submit" className="primary-button">Keep this reflection <Check size={16} /></button>}
    </div>
  </form>;
}

export default function ReflectView({ entries, onWrite }: { entries: DailyCheckIn[]; onWrite: (date: string) => void }) {
  const today = relativeDay(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const filtered = filterReflections(entries, from, to);
  const todayEntry = entries.find((entry) => entry.date === today);
  const invalidRange = !!from && !!to && from > to;
  return <div className="reflect-view">
    <SectionHeading eyebrow="A MOMENT FOR YOURSELF" title="Reflect." />
    <section className="journal-invitation">
      <div><p className="eyebrow"><span className="green-dot" />{prettyDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h2>{todayEntry ? "There is always room for another thought." : "Pause. Notice. Make room for you."}</h2>
        <p>A few gentle questions about how you feel, what mattered, and what comes next. Two minutes is enough.</p>
        <button className="primary-button" onClick={() => onWrite(today)}>{todayEntry ? "Revisit today" : "Start today’s reflection"}<ArrowRight size={16} /></button>
      </div><Leaf size={64} strokeWidth={1} aria-hidden="true" />
    </section>
    <div className="journal-history-heading"><div><p className="eyebrow">YOUR JOURNAL</p><h2>The days, in your words.</h2></div><span>{entries.length} {entries.length === 1 ? "reflection" : "reflections"}</span></div>
    <div className="journal-filters">
      <label>From<input type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} /></label>
      <label>To<input type="date" value={to} min={from || undefined} max={today} onChange={(e) => setTo(e.target.value)} /></label>
      <button className="secondary-button" onClick={() => { setFrom(relativeDay(-6)); setTo(today); }}>Last 7 days</button>
      {(from || to) && <button className="text-button" onClick={() => { setFrom(""); setTo(""); }}>Clear dates</button>}
    </div>
    <p className="form-hint" role="status">{invalidRange ? "Choose an end date on or after the start date." : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"} · newest first`}</p>
    {!filtered.length && <Empty>{entries.length ? "No reflections in this date range. Try different dates." : "Your words will find a home here. Begin with how you feel today."}</Empty>}
    <div className="journal-history">{filtered.map((entry) => <details className="journal-entry" key={entry.id}>
      <summary><div><time dateTime={entry.date}>{prettyDate(entry.date, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</time><span>Mood {entry.mood}/10{entry.energy !== undefined && ` · Energy ${entry.energy}/10`}</span></div><span className="journal-read">Read entry <span aria-hidden="true">+</span></span></summary>
      <div className="journal-entry-body">
        {[["What moved forward", entry.movedForward], ["On your mind", entry.reflection.text], [entry.dailyPrompt || "A little perspective", entry.dailyAnswer], ["Glad for today", entry.gratitude], ["For tomorrow", entry.tomorrow]].filter(([, answer]) => answer?.trim()).map(([question, answer]) => <div key={question}><h3>{question}</h3><p>{answer}</p></div>)}
        {![entry.movedForward, entry.reflection.text, entry.dailyAnswer, entry.gratitude, entry.tomorrow].some((value) => value?.trim()) && <p>A moment to check in. No words needed.</p>}
        <button className="secondary-button" onClick={() => onWrite(entry.date)}>Edit reflection</button>
      </div>
    </details>)}</div>
  </div>;
}
