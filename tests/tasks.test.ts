import { it } from "node:test";
import assert from "node:assert/strict";
import { emptyAccount } from "../src/lib/account/repository";
import { changeTaskStatus, editTaskSession, taskHistory, taskStatus } from "../src/lib/prototype/tasks";
import { ActiveTimer, Task } from "../src/lib/prototype/types";
const task: Task = {id:"stripe",title:"Integrate Stripe",area:"do",category:"Work",completed:false,description:"Checkout and receipts",notes:[{id:"n",text:"Initial research",createdAt:"2026-10-28T10:00:00Z"}]};
const fresh=()=>({...emptyAccount({id:"owner",user_metadata:{}}),tasks:[{...task}, {...task,id:"other",title:"Another task",notes:[]}]});
const now=Date.parse("2026-10-29T10:30:00Z");
const timer:ActiveTimer={taskId:"stripe",startedAt:"2026-10-29T10:00:00Z",elapsed:60,runningSince:now-120000};
it("completes a task and saves only focused time from its running session atomically",()=>{
 const original=fresh();const result=changeTaskStatus(original,"stripe","done",timer,now,()=>"session");
 assert.equal(result.tasks[0].completed,true);assert.equal(taskStatus(result.tasks[0]),"done");assert.equal(result.sessions[0].taskId,"stripe");assert.equal(result.sessions[0].durationSeconds,180);assert.equal(result.sessions[0].endedAt,new Date(now).toISOString());assert.equal(result.activities.length,2);assert.equal(result.activities.find(a=>a.kind==="session")?.minutes,3);assert.equal(original.sessions.length,0);assert.deepEqual(result.tasks[0].notes,task.notes);assert.equal(result.tasks[0].description,task.description);
});
it("saves a paused session without counting the pause and respects a captured finish time",()=>{
 const result=changeTaskStatus(fresh(),"stripe","done",{...timer,elapsed:75,runningSince:null,endedAt:"2026-10-29T10:20:00Z"},now,()=>"paused");assert.equal(result.sessions[0].durationSeconds,75);assert.equal(result.sessions[0].endedAt,"2026-10-29T10:20:00Z");
});
it("does not duplicate sessions on repeated Done and reopening preserves history",()=>{
 const first=changeTaskStatus(fresh(),"stripe","done",timer,now,()=>"first");const repeated=changeTaskStatus(first,"stripe","done",timer,now,()=>"second");assert.equal(repeated.sessions.length,1);assert.equal(repeated.activities.filter(a=>a.kind==="task").length,1);
 const reopened=changeTaskStatus(repeated,"stripe","todo",null,now,()=>"unused");assert.equal(reopened.tasks[0].completed,false);assert.equal(reopened.sessions.length,1);assert.equal(reopened.activities.filter(a=>a.kind==="task").length,0);
});
it("does not save or affect another task’s active timer",()=>{const result=changeTaskStatus(fresh(),"other","done",timer,now,()=>"unused");assert.equal(result.sessions.length,0);assert.equal(result.tasks[0].completed,false);assert.equal(result.tasks[1].completed,true);});
it("totals only this task’s saved sessions across all dates and excludes pauses/activity mirrors",()=>{
 let state=changeTaskStatus(fresh(),"stripe","done",timer,now,()=>"a");state=changeTaskStatus(state,"stripe","todo",null,now,()=>"unused");state=changeTaskStatus(state,"stripe","done",{...timer,startedAt:"2026-10-28T09:00:00Z",elapsed:45,runningSince:null},now-86400000,()=>"b");
 const history=taskHistory(state,"stripe");assert.equal(history.sessions.length,2);assert.equal(history.seconds,225);assert.equal(history.days,2);assert.equal(taskHistory(state,"other").seconds,0);
});
it("corrects session attribution and its activity mirror without changing elapsed time",()=>{
 const state=changeTaskStatus(fresh(),"stripe","done",timer,now,()=>"a");const edited=editTaskSession(state,"a","other","Updated session note");assert.equal(taskHistory(edited,"stripe").seconds,0);assert.equal(taskHistory(edited,"other").seconds,180);assert.equal(edited.activities.find(a=>a.id==="session-a")?.note,"Updated session note");assert.equal(edited.sessions[0].endedAt,state.sessions[0].endedAt);assert.equal(state.sessions[0].taskId,"stripe");assert.equal(editTaskSession(state,"a","missing","note"),state);
});
it("understands legacy tasks and does not infer completion from missing optional fields",()=>{assert.equal(taskStatus(task),"todo");assert.equal(taskStatus({...task,status:"in_progress"}),"in_progress");assert.equal(taskStatus({...task,completed:true}),"done");});
