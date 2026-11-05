"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Info, Sprout } from "lucide-react";
import { Activity } from "@/lib/prototype/types";
import { historyGeometry, historyWindow, historyYears } from "@/lib/prototype/activity-history";
import {
  momentum,
  prettyDate,
  relativeDay,
  streak,
} from "@/lib/prototype/seed";

export default function ActivityGrid({
  activities,
  registeredAt,
  onDay,
  onMomentum,
}: {
  activities: Activity[];
  registeredAt?: string;
  onDay: (date: string) => void;
  onMomentum: () => void;
}) {
  const [weeks, setWeeks] = useState(16);
  const [year, setYear] = useState<number | null>(null);
  const [referenceColumns, setReferenceColumns] = useState(16);
  const [layout, setLayout] = useState({ width: 400, gap: 4 });
  const chosenRange = useRef(false);
  const body = useRef<HTMLDivElement>(null);
  const years = historyYears(registeredAt);
  const selectedYear = year !== null && years.includes(year) ? year : null;
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1001px)");
    const adapt = () => { const columns = media.matches ? 26 : 16; setReferenceColumns(columns); if (!chosenRange.current) setWeeks(columns); };
    adapt();
    media.addEventListener("change", adapt);
    return () => media.removeEventListener("change", adapt);
  }, []);
  const today = relativeDay(0);
  const range = useMemo(() => historyWindow(today, weeks, selectedYear), [today, weeks, selectedYear]);
  const { days, columns, visibleStart, visibleEnd } = range;
  const geometry = historyGeometry(layout.width, referenceColumns, layout.gap, columns);
  useEffect(() => {
    const element = body.current;
    if (!element) return;
    const measure = () => {
      const css = getComputedStyle(element);
      const width = element.getBoundingClientRect().width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
      const gap = parseFloat(css.getPropertyValue("--grid-gap")) || 4;
      if (width > 0) setLayout((current) => Math.abs(current.width - width) < .01 && current.gap === gap ? current : { width, gap });
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const counts = useMemo(
    () =>
      activities.reduce<Record<string, number>>((all, a) => {
        all[a.date] = (all[a.date] || 0) + 1;
        return all;
      }, {}),
    [activities],
  );
  const activeDays = days.filter((d) => d >= visibleStart && d <= visibleEnd && counts[d]).length;
  const monthLabels = Array.from({ length: columns }, (_, index) => {
    const date = days.slice(index * 7, index * 7 + 7).find((day) => day >= visibleStart && day <= visibleEnd);
    const previous = days.slice((index - 1) * 7, index * 7).find((day) => day >= visibleStart && day <= visibleEnd);
    return date && (!previous || date.slice(0,7) !== previous.slice(0,7)) ? prettyDate(date, { month: "short" }) : "";
  });
  const nextMonth = monthLabels.findIndex((label, index) => index > 0 && label);
  if (nextMonth > 0 && nextMonth * (layout.width + geometry.gap) / columns < 18) monthLabels[0] = "";
  return (
    <section className="card activity-card" aria-label="Your activity history">
      <div className="section-heading">
        <div className="with-icon">
          <span className="small-icon">
            <Sprout size={18} />
          </span>
          <h2>Your days.</h2>
        </div>
        <div className="activity-history-filters">
          {!!years.length && <select aria-label="Activity grid year" className="quiet-select activity-year-select" value={selectedYear ?? "recent"} onChange={(event) => setYear(event.target.value === "recent" ? null : Number(event.target.value))}>
            <option value="recent">Recent</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>}
          <select aria-label="Activity grid range" className="quiet-select" value={selectedYear === null ? weeks : "year"} onChange={(event) => { if (event.target.value === "year") return; chosenRange.current = true; setYear(null); setWeeks(Number(event.target.value)); }}>
            {selectedYear !== null && <option value="year">Full year</option>}
            <option value={52}>Last 52 weeks</option><option value={26}>Last 26 weeks</option><option value={16}>Last 16 weeks</option><option value={8}>Last 8 weeks</option>
          </select>
        </div>
      </div>
      <p className="muted grid-description">Small things. Seen over time.</p>
      <div className="contribution-chart">
        <div className="day-labels" style={{ rowGap: layout.gap }}>
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div className="grid-chart-body" ref={body}>
          <div
            className="month-labels"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, columnGap: geometry.gap }}
          >
            {monthLabels.map((label, index) => <span key={index}>{label}</span>)}
          </div>
          <div
            className="contribution-grid"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, height: geometry.height, rowGap: layout.gap, columnGap: geometry.gap }}
          >
            {days.map((d) => (
              <button
                key={d}
                disabled={d < visibleStart || d > visibleEnd}
                aria-hidden={d < visibleStart || (selectedYear !== null && !d.startsWith(String(selectedYear))) ? true : undefined}
                style={{ width: geometry.cell, height: geometry.cell, borderRadius: Math.min(3, geometry.cell / 6) }}
                className={`day-square intensity-${Math.min(4, counts[d] ? (counts[d] === 1 ? 1 : counts[d] === 2 ? 2 : counts[d] < 5 ? 3 : 4) : 0)} ${d === today ? "is-today" : ""} ${d < visibleStart || d > visibleEnd ? "future-day" : ""}`}
                aria-label={`${prettyDate(d, {month: "long", day: "numeric", year: "numeric"})}, ${counts[d] || 0} meaningful activities${d === today ? ", today" : ""}`}
                title={`${prettyDate(d, {month: "long", day: "numeric", year: "numeric"})} · ${counts[d] || 0} activities`}
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
