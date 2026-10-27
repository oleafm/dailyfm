import { DailyCheckIn, PrototypeState } from "./types";

// Visual choices map to the existing 1–10 scale without rewriting old scores.
export function ratingIndex(value: number) { return Math.max(0, Math.min(4, Math.round((value - 2) / 2))); }
export function filterReflections(entries: DailyCheckIn[], from = "", to = ""): DailyCheckIn[] {
  return entries.filter((entry) => (!from || entry.date >= from) && (!to || entry.date <= to))
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function saveReflection(state: PrototypeState, entry: DailyCheckIn): PrototypeState {
  return {
    ...state,
    checkIns: [...state.checkIns.filter((item) => item.date !== entry.date), entry],
    activities: [...state.activities.filter((item) => item.id !== `checkin-${entry.date}`), {
      id: `checkin-${entry.date}`, title: "Made a little room to reflect", date: entry.date,
      area: "be", category: "Reflect", kind: "reflection", minutes: 0,
      note: entry.movedForward, source: "manual",
    }],
  };
}
