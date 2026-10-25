import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyAccount } from "../src/lib/account/repository";
import { chronologicalActivities, finishSession, SessionDetails } from "../src/lib/prototype/sessions";
import { ActiveTimer, Activity } from "../src/lib/prototype/types";
import { dateKey } from "../src/lib/prototype/seed";

const fresh = () => emptyAccount({ id: "11111111-1111-4111-8111-111111111111", email: "person@example.test", user_metadata: {} });
const timer: ActiveTimer = { startedAt: "2026-10-25T09:00:00.000Z", endedAt: "2026-10-25T09:30:00.000Z", elapsed: 120, runningSince: null, area: "do" };
const details: SessionDetails = { title: "Focused work", area: "do", category: "Work", note: "Done" };
describe("immediate focus and accurate time history", () => {
  it("saves a session without requiring a task or project", () => {
    const saved = finishSession(fresh(), timer, 120, details, () => "session");
    assert.equal(saved.tasks.length, 0);
    assert.equal(saved.projects.length, 0);
    assert.equal(saved.sessions[0].taskId, undefined);
    assert.equal(saved.sessions[0].title, "Focused work");
    assert.equal(saved.activities.length, 1);
  });
  it("keeps real start/end times separately from focused duration and pauses", () => {
    const saved = finishSession(fresh(), timer, 120, details, () => "session");
    assert.equal(saved.sessions[0].durationSeconds, 120);
    assert.equal(saved.sessions[0].startedAt, timer.startedAt);
    assert.equal(saved.sessions[0].endedAt, timer.endedAt);
    assert.equal(saved.activities[0].minutes, 2);
    assert.equal(saved.activities[0].endedAt, timer.endedAt);
  });
  it("creates project and task only on finish, linking both records atomically", () => {
    const original = fresh();
    let id = 0;
    const saved = finishSession(original, timer, 120, { ...details, createTask: true, newProjectName: "New project", category: "Create" }, () => `id-${++id}`);
    assert.equal(original.projects.length, 0);
    assert.equal(original.tasks.length, 0);
    assert.equal(saved.projects[0].name, "New project");
    assert.equal(saved.tasks[0].projectId, saved.projects[0].id);
    assert.equal(saved.sessions[0].taskId, saved.tasks[0].id);
    assert.equal(saved.activities[0].projectId, saved.projects[0].id);
    assert.equal(saved.activities[0].category, "Create");
  });
  it("links an existing task without creating duplicates", () => {
    const state = fresh();
    state.tasks.push({ id: "task", title: "Existing", area: "be", category: "Rest", completed: false });
    const saved = finishSession(state, timer, 65, { ...details, taskId: "task", area: "be", category: "Rest" }, () => "session");
    assert.equal(saved.tasks.length, 1);
    assert.equal(saved.sessions[0].taskId, "task");
    assert.equal(saved.activities[0].area, "be");
  });
  it("uses the captured finish date, even when the form is saved later", () => {
    const saved = finishSession(fresh(), timer, 120, details, () => "session");
    assert.equal(saved.sessions[0].date, dateKey(new Date(timer.endedAt!)));
  });
  it("sorts mixed Do/Be entries by exact start time without mutating history", () => {
    const activity = (id: string, start: string, area: "do" | "be"): Activity => ({ id, title: id, startedAt: start, date: "2026-10-25", area, category: "Work", kind: "session", minutes: 1, source: "timer" });
    const activities = [activity("later", "2026-10-25T15:00:00Z", "do"), activity("first", "2026-10-25T09:00:00Z", "be"), activity("middle", "2026-10-25T12:00:00Z", "do")];
    assert.deepEqual(chronologicalActivities(activities).map((a) => a.id), ["first", "middle", "later"]);
    assert.equal(activities[0].id, "later");
  });
  it("uses legacy starts but never invents missing ends from summed time", () => {
    const activity: Activity = { id: "session-old", title: "Legacy", date: "2026-10-25", area: "do", category: "Work", kind: "session", minutes: 5, source: "timer" };
    const result = chronologicalActivities([activity], [{ id: "old", taskId: "task", startedAt: timer.startedAt, durationSeconds: 300, date: activity.date, note: "" }]);
    assert.equal(result[0].startedAt, timer.startedAt);
    assert.equal(result[0].endedAt, undefined);
    assert.equal(activity.startedAt, undefined);
  });
});
