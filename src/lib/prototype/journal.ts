import { DailyCheckIn, PrototypeState } from "./types";

const prompts = [
  "What gave you energy today, and what took it away?",
  "When did you feel most like yourself today?",
  "What did you need today that you could make room for tomorrow?",
  "What is one thing you learned about yourself today?",
  "Who or what helped you feel connected today?",
  "What can you let go of for tonight?",
  "What small moment would you like to remember?",
];
export function promptForDate(date: string): string {
  const day = Math.floor(Date.parse(`${date}T12:00:00Z`) / 86400000);
  return prompts[((day % prompts.length) + prompts.length) % prompts.length];
}
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
