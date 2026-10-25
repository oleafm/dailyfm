import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { emptyAccount, validState } from "../src/lib/account/repository";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const fresh = (id: string) => emptyAccount({ id, email: "person@example.test", user_metadata: {} });
let db: PGlite;
async function asUser(id: string) {
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}
describe("private account database", () => {
  before(async () => {
    db = new PGlite();
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
    await db.query("insert into auth.users values ($1),($2)", [alice, bob]);
    const migration = await readFile("supabase/migrations/202610250001_user_workspaces.sql", "utf8");
    await db.exec(migration);
    await db.exec(migration); // Safe to apply again without losing existing records.
    await db.query("insert into public.user_workspaces(user_id,data) values ($1,$2),($3,$4)", [alice, fresh(alice), bob, fresh(bob)]);
  });
  beforeEach(async () => { await asUser(alice); });
  after(async () => { await db.close(); });

  it("starts real accounts with no fabricated history", () => {
    const state = fresh(alice);
    assert.ok(validState(state, alice));
    for (const key of ["tasks", "projects", "sessions", "activities", "checkIns", "challenges", "completions"] as const) assert.equal(state[key].length, 0);
    assert.equal(validState(state, bob), false);
  });
  it("returns only the signed-in owner's data", async () => {
    const result = await db.query<{ user_id: string }>("select user_id from public.user_workspaces");
    assert.deepEqual(result.rows, [{ user_id: alice }]);
  });
  it("rejects anonymous reads", async () => {
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.query("select * from public.user_workspaces"), /permission denied/);
  });
  it("prevents reading or overwriting another account", async () => {
    assert.equal((await db.query("select * from public.user_workspaces where user_id=$1", [bob])).rows.length, 0);
    assert.equal((await db.query("update public.user_workspaces set revision=revision+1 where user_id=$1 returning user_id", [bob])).rows.length, 0);
    await assert.rejects(db.query("update public.user_workspaces set user_id=$1,data=$2 where user_id=$3", [bob, fresh(bob), alice]), /row-level security/);
  });
  it("atomically stores a session and its activity and rejects stale revisions", async () => {
    const state = fresh(alice);
    state.tasks.push({ id: "task-1", title: "Real work", area: "do", category: "Work", completed: false });
    state.sessions.push({ id: "session-1", taskId: "task-1", startedAt: "2026-10-25T09:00:00Z", durationSeconds: 125, date: "2026-10-25", note: "Progress" });
    state.activities.push({ id: "session-session-1", title: "Real work", area: "do", category: "Work", date: "2026-10-25", minutes: 125 / 60, kind: "session", source: "timer" });
    const first = await db.query("update public.user_workspaces set data=$1,revision=1 where user_id=$2 and revision=0 returning revision", [state, alice]);
    assert.equal(first.rows.length, 1);
    const stale = await db.query("update public.user_workspaces set data=$1,revision=1 where user_id=$2 and revision=0 returning revision", [fresh(alice), alice]);
    assert.equal(stale.rows.length, 0);
    const saved = await db.query<{ data: typeof state }>("select data from public.user_workspaces");
    assert.equal(saved.rows[0].data.sessions[0].durationSeconds, 125);
    assert.equal(saved.rows[0].data.activities[0].minutes, 125 / 60);
  });
  it("rejects malformed documents and an incorrect document owner", async () => {
    await assert.rejects(db.query("update public.user_workspaces set data=$1 where user_id=$2", [{ version: 1 }, alice]), /workspace_shape/);
    await assert.rejects(db.query("update public.user_workspaces set data=$1 where user_id=$2", [fresh(bob), alice]), /workspace_shape/);
  });
  it("keeps each account's revision and sessions separate", async () => {
    await asUser(bob);
    const result = await db.query<{ revision: number; data: ReturnType<typeof fresh> }>("select revision,data from public.user_workspaces");
    assert.equal(Number(result.rows[0].revision), 0);
    assert.equal(result.rows[0].data.sessions.length, 0);
  });
});
