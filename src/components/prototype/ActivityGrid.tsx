"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Info, Sprout } from "lucide-react";
import { Activity } from "@/lib/prototype/types";
import {
  dateKey,
  momentum,
  prettyDate,
  relativeDay,
  streak,
} from "@/lib/prototype/seed";

export default function ActivityGrid({
  activities,
  onDay,
  onMomentum,
}: {
  activities: Activity[];
  onDay: (date: string) => void;
  onMomentum: () => void;
}) {
  const [weeks, setWeeks] = useState(16);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1001px)");
    const adapt = () => setWeeks(media.matches ? 26 : 16);
    adapt();
    media.addEventListener("change", adapt);
    return () => media.removeEventListener("change", adapt);
  }, []);
  const today = relativeDay(0);
  const days = useMemo(() => {
    const start = new Date(today + "T12:00:00");
    start.setDate(
      start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7,
    );
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return dateKey(d);
    });
  }, [today, weeks]);
  const counts = useMemo(
    () =>
      activities.reduce<Record<string, number>>((all, a) => {
        all[a.date] = (all[a.date] || 0) + 1;
        return all;
      }, {}),
    [activities],
  );
  const activeDays = days.filter((d) => d <= today && counts[d]).length;
  return (
    <section className="card activity-card" aria-label="Your activity history">
      <div className="section-heading">
        <div className="with-icon">
          <span className="small-icon">
            <Sprout size={18} />
          </span>
          <h2>Your days.</h2>
        </div>
        <select
          aria-label="Activity grid range"
          className="quiet-select"
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
        >
          <option value={26}>Last 26 weeks</option>
          <option value={16}>Last 16 weeks</option>
          <option value={8}>Last 8 weeks</option>
        </select>
      </div>
      <p className="muted grid-description">Small things. Seen over time.</p>
      <div className="contribution-chart">
        <div className="day-labels">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="grid-chart-body">
          <div
            className="month-labels"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
          >
            {days
              .filter((_, i) => i % 7 === 0)
              .map((d, i, all) => (
                <span key={d}>
                  {i === 0 || d.slice(5, 7) !== all[i - 1].slice(5, 7)
                    ? prettyDate(d, { month: "short" })
                    : ""}
                </span>
              ))}
          </div>
          <div
            className="contribution-grid"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
          >
            {days.map((d) => (
              <button
                key={d}
                disabled={d > today}
                className={`day-square intensity-${Math.min(4, counts[d] ? (counts[d] === 1 ? 1 : counts[d] === 2 ? 2 : counts[d] < 5 ? 3 : 4) : 0)} ${d === today ? "is-today" : ""} ${d > today ? "future-day" : ""}`}
                aria-label={`${prettyDate(d)}, ${counts[d] || 0} meaningful activities${d === today ? ", today" : ""}`}
                title={`${prettyDate(d)} · ${counts[d] || 0} activities`}
                onClick={() => onDay(d)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid-footer">
        <span>
          <strong>{activeDays}</strong> days with something meaningful
        </span>
        <div className="grid-legend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className={`intensity-${i}`} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="evidence-metrics">
        <div>
          <span className="metric-label">Showing up</span>
          <p>
            {streak(activities)} <small>days</small>
            <Sprout size={18} />
          </p>
          <span className="metric-note">One meaningful action is enough.</span>
        </div>
        <div>
          <span className="metric-label">Your rhythm</span>
          <p>
            {streak(activities, "do")} <small>Do</small>
            <span className="metric-divider">/</span>
            {streak(activities, "be")} <small>Be</small>
          </p>
          <span className="metric-note">
            Consecutive days, in your own way.
          </span>
        </div>
        <button className="momentum-metric" onClick={onMomentum}>
          <span className="metric-label">
            Momentum <Info size={12} />
          </span>
          <p>
            {momentum(activities)}
            <ArrowUpRight size={21} />
          </p>
          <span className="metric-note">Built on recent consistency.</span>
        </button>
      </div>
    </section>
  );
}
