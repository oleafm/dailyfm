import { before, after, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { emptyAccount } from "../src/lib/account/repository";
const alice="11111111-1111-4111-8111-111111111111",bob="22222222-2222-4222-8222-222222222222";
const fresh=(id:string)=>emptyAccount({id,email:"test@example.test",user_metadata:{}});
const tables=["accounts","projects","tasks","sessions","activities","check_ins","challenges","memories"];
let db:PGlite;
async function owner(id:string){await db.exec("reset role;set role authenticated");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
async function load(id:string){await owner(id);return (await db.query<{value:any}>("select public.daily_load_workspace($1) as value",[fresh(id)])).rows[0].value;}
async function save(data:any,rev:number){return (await db.query<{rev:number}>("select public.daily_save_workspace($1,$2) as rev",[data,rev])).rows[0].rev;}
before(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);await db.query("insert into auth.users values($1),($2)",[alice,bob]);await db.exec(await readFile("supabase/migrations/202610250001_user_workspaces.sql","utf8"));const legacy=fresh(alice);legacy.projects.push({id:"legacy",name:"Kept",description:"",color:"sage",milestones:[]});await db.query("insert into public.user_workspaces values($1,$2,4)",[alice,legacy]);await db.exec("create table public.time_entries(id text,notes text); grant all on public.time_entries to anon,authenticated; insert into public.time_entries values ('legacy','private');");await db.exec(await readFile("supabase/migrations/202610260001_owned_records.sql","utf8"));});
after(async()=>{await db.close();});
it("imports legacy data exactly once and preserves revisions",async()=>{const first=await load(alice);assert.equal(first.revision,4);assert.equal(first.data.projects[0].name,"Kept");assert.deepEqual((await load(alice)).data,first.data);});
it("creates empty accounts without sample history",async()=>{const record=await load(bob);assert.equal(record.revision,0);assert.equal(record.data.projects.length,0);});
it("denies anonymous reads and RPC execution",async()=>{await db.exec("reset role;set role anon");for(const table of tables)await assert.rejects(db.query(`select * from public.daily_${table}`),/permission denied/);await assert.rejects(db.query("select public.daily_load_workspace($1)",[fresh(alice)]),/permission denied/);});
it("isolates all tables and forbids spoofing another owner",async()=>{await owner(bob);for(const table of tables)assert.equal((await db.query(`select * from public.daily_${table} where user_id=$1`,[alice])).rows.length,0);await assert.rejects(save(fresh(alice),4),/Invalid account/);await assert.rejects(db.query("insert into public.daily_projects(user_id,id,payload) values($1,'evil',$2)",[alice,{id:"evil",name:"Evil",description:"",color:"sage",milestones:[]}]),/row-level security/);});
it("rejects cross-user project references even when the other project exists",async()=>{await owner(bob);await assert.rejects(db.query("insert into public.daily_tasks(user_id,id,payload) values($1,'bad',$2)",[bob,{id:"bad",title:"Bad",area:"do",category:"Work",completed:false,projectId:"legacy"}]),/foreign key/);});
it("saves entities atomically, preserves order, and rejects stale writes",async()=>{const record=await load(bob);record.data.projects=[{id:"z",name:"First",description:"",color:"sage",milestones:[]},{id:"a",name:"Second",description:"",color:"sage",milestones:[]}];record.data.tasks=[{id:"t",title:"Task",area:"do",category:"Work",projectId:"z",completed:false}];record.data.sessions=[{id:"s",taskId:"t",projectId:"z",startedAt:"2026-10-26T09:00:00Z",endedAt:"2026-10-26T09:10:00Z",durationSeconds:600,date:"2026-10-26",note:"Private"}];assert.equal(Number(await save(record.data,0)),1);await assert.rejects(save(fresh(bob),0),/Workspace conflict/);const loaded=await load(bob);assert.deepEqual(loaded.data.projects.map((p:any)=>p.id),["z","a"]);assert.equal(loaded.data.sessions[0].durationSeconds,600);});
it("rolls back every entity if one reference is invalid",async()=>{const record=await load(bob);record.data.projects[0].name="Must roll back";record.data.tasks[0].projectId="nonexistent";await assert.rejects(save(record.data,1),/foreign key/);const result=await load(bob);assert.equal(result.data.projects[0].name,"First");assert.equal(result.revision,1);});
it("rejects malformed records and keeps the original backup read-only",async()=>{const record=await load(bob);record.data.tasks[0].completed="yes";await assert.rejects(save(record.data,1),/check constraint/);await owner(alice);await assert.rejects(db.query("update public.user_workspaces set revision=100"),/permission denied/);});

it("does not permit authenticated cross-account updates or deletes",async()=>{
 await owner(alice);
 for(const table of tables){
  assert.equal((await db.query(`delete from public.daily_${table} where user_id=$1 returning user_id`,[bob])).rows.length,0);
 }
 assert.equal((await db.query("update public.daily_tasks set payload=jsonb_set(payload,'{title}','\"stolen\"') where user_id=$1 returning id",[bob])).rows.length,0);
});
it("closes access to unscoped legacy prototype tables",async()=>{
 await owner(alice);await assert.rejects(db.query("select * from public.time_entries"),/permission denied/);
 await db.exec("reset role;set role anon");await assert.rejects(db.query("select * from public.time_entries"),/permission denied/);
});

it("does not resurrect the recovery copy after an owner resets their content",async()=>{
 await owner(alice);await db.query("delete from public.daily_accounts where user_id=$1",[alice]);
 const reset=await load(alice);assert.equal(reset.data.projects.length,0);
 const other=await load(bob);assert.equal(other.data.sessions.length,1);
});
it("aborts an invalid legacy migration without losing the old data",async()=>{
 const isolated=new PGlite();
 try {
  await isolated.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  await isolated.query("insert into auth.users values($1)",[alice]);
  await isolated.exec(await readFile("supabase/migrations/202610250001_user_workspaces.sql","utf8"));
  const invalid=fresh(alice);invalid.tasks.push({id:"bad",title:"Keep for recovery",area:"do",category:"Work",completed:false,projectId:"missing"});
  await isolated.query("insert into public.user_workspaces values($1,$2,2)",[alice,invalid]);
  await assert.rejects(isolated.exec(await readFile("supabase/migrations/202610260001_owned_records.sql","utf8")),/foreign key/);
  await isolated.exec("rollback");
  assert.equal((await isolated.query<{table_name:string|null}>("select to_regclass('public.daily_accounts')::text as table_name")).rows[0].table_name,null);
  assert.deepEqual((await isolated.query<{data:typeof invalid}>("select data from public.user_workspaces")).rows[0].data,invalid);
 } finally {await isolated.close();}
});
it("keeps every populated personal-data collection private across accounts",async()=>{
 const record=await load(alice);const data=record.data;
 data.projects=[{id:"z",name:"Private project",description:"Personal",color:"sage",milestones:[]}];
 data.tasks=[{id:"t",title:"Private task",area:"do",category:"Work",projectId:"z",completed:false}];
 data.sessions=[{id:"s",taskId:"t",projectId:"z",startedAt:"2026-10-26T09:00:00Z",durationSeconds:60,date:"2026-10-26",note:"Private session"}];
 data.activities=[{id:"a",title:"Private activity",date:"2026-10-26",area:"do",category:"Work",kind:"session",minutes:1,source:"timer",projectId:"z"}];
 data.checkIns=[{id:"c",date:"2026-10-26",mood:5,energy:3,gratitude:"Private gratitude",tomorrow:"Rest",dailyPrompt:"What helped?",dailyAnswer:"Private answer",movedForward:"Private thoughts",reflection:{id:"r",date:"2026-10-26",text:"Private reflection"}}];
 data.challenges=[{id:"h",title:"Private invitation",description:"Personal",category:"Explore",target:1,month:"2026-10"}];
 data.completions=[{id:"m",challengeId:"h",title:"Private memory",photo:"data:image/png;base64,PRIVATE_FIXTURE",photoIsSample:false,note:"Private note",date:"2026-10-26",location:"Private location",again:"Yes"}];
 await save(data,record.revision);
 assert.deepEqual((await load(alice)).data.checkIns,data.checkIns);
 for(const table of tables)assert.equal((await db.query(`select * from public.daily_${table} where user_id=$1`,[alice])).rows.length,1);
 await owner(bob);
 for(const table of tables){
  assert.equal((await db.query(`select * from public.daily_${table} where user_id=$1`,[alice])).rows.length,0);
  assert.equal((await db.query(`update public.daily_${table} set user_id=user_id where user_id=$1 returning user_id`,[alice])).rows.length,0);
  assert.equal((await db.query(`delete from public.daily_${table} where user_id=$1 returning user_id`,[alice])).rows.length,0);
 }
});
