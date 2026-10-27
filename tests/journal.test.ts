import { it } from "node:test";
import assert from "node:assert/strict";
import { filterReflections, ratingIndex, saveReflection } from "../src/lib/prototype/journal";
import { emptyAccount } from "../src/lib/account/repository";
import { DailyCheckIn } from "../src/lib/prototype/types";
const entry = (date: string): DailyCheckIn => ({ id: date, date, mood: 6, energy: 3, movedForward: "A small step", reflection: { id: `r-${date}`, date, text: "My thoughts" }, dailyPrompt: "An older prompt", dailyAnswer: "A walk", gratitude: "A friend", tomorrow: "Rest" });
it("filters inclusive date boundaries, supports one-sided ranges, and sorts newest first without mutating history", () => {
  const entries = [entry("2026-10-20"), entry("2026-10-22"), entry("2026-10-21")];
  assert.deepEqual(filterReflections(entries, "2026-10-21", "2026-10-22").map(e => e.date), ["2026-10-22", "2026-10-21"]);
  assert.equal(filterReflections(entries, "2026-10-22").length, 1);
  assert.equal(filterReflections(entries, "", "2026-10-20").length, 1);
  assert.equal(filterReflections(entries, "2026-10-22", "2026-10-20").length, 0);
  assert.equal(entries[0].date, "2026-10-20");
});
it("editing a historical reflection replaces that day only and does not duplicate its activity", () => {
  const state = emptyAccount({ id: "owner", user_metadata: {} });
  const first = saveReflection(state, entry("2026-10-20"));
  const next = saveReflection(first, entry("2026-10-21"));
  const edited = saveReflection(next, { ...first.checkIns[0], energy: 8, gratitude: "Updated" });
  assert.equal(edited.checkIns.length, 2); assert.equal(edited.activities.length, 2);
  assert.equal(edited.checkIns.find(e => e.date === "2026-10-20")?.energy, 8);
  assert.equal(edited.checkIns.find(e => e.date === "2026-10-21")?.gratitude, "A friend");
  assert.equal(first.checkIns[0].energy, 3);
  assert.equal(edited.activities.find(e => e.date === "2026-10-20")?.id, "checkin-2026-10-20");
});
it("maps all historical 1–10 ratings to five visual choices", () => {
  assert.deepEqual([2,4,6,8,10].map(ratingIndex), [0,1,2,3,4]);
  for (let score=1; score<=10; score++) assert.ok(ratingIndex(score)>=0 && ratingIndex(score)<=4);
  assert.equal(ratingIndex(1),0); assert.equal(ratingIndex(10),4);
});
it("legacy mood-only check-ins remain readable and editable", () => {
  const legacy: DailyCheckIn = { id: "old", date: "2026-10-19", mood: 4, movedForward: "", reflection: { id: "r", date: "2026-10-19", text: "Older thoughts" } };
  assert.equal(filterReflections([legacy])[0].reflection.text, "Older thoughts");
  const state = emptyAccount({ id: "owner", user_metadata: {} });
  assert.equal(saveReflection(state, legacy).checkIns[0].energy, undefined);
});
