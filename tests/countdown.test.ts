import { it } from "node:test";
import assert from "node:assert/strict";
import { countdownTarget, finishTimer, timerDisplay, timerElapsed } from "../src/lib/prototype/active-timer";
import { ActiveTimer } from "../src/lib/prototype/types";
import { changeTaskStatus } from "../src/lib/prototype/tasks";
import { emptyAccount } from "../src/lib/account/repository";
const start=Date.parse("2026-11-11T10:00:00Z");
const timer:ActiveTimer={startedAt:new Date(start).toISOString(),elapsed:0,runningSince:start,mode:"countdown",targetSeconds:300,soundEnabled:true};
it("counts down while recording focused elapsed time, and caps overdue timers",()=>{
 assert.equal(timerDisplay(timer,start+60000),240);assert.equal(timerElapsed(timer,start+60000),60);
 assert.equal(timerDisplay(timer,start+900000),0);assert.equal(timerElapsed(timer,start+900000),300);
 const done=finishTimer(timer,start+900000);assert.equal(done.endedAt,new Date(start+300000).toISOString());assert.equal(done.elapsed,300);assert.equal(done.runningSince,null);assert.equal(done.countdownCompleted,true);
});
it("excludes pauses and calculates the true finish timestamp after resume",()=>{
 const paused={...timer,elapsed:60,runningSince:null};assert.equal(timerDisplay(paused,start+900000),240);
 const resumed={...paused,runningSince:start+600000};const done=finishTimer(resumed,start+1000000);
 assert.equal(done.elapsed,300);assert.equal(done.endedAt,new Date(start+840000).toISOString());
});
it("allows early finish and preserves stopwatch and legacy timer behavior",()=>{
 const early=finishTimer(timer,start+100000);assert.equal(early.elapsed,100);assert.equal(early.countdownCompleted,undefined);
 const legacy={startedAt:timer.startedAt,elapsed:10,runningSince:start};assert.equal(timerDisplay(legacy,start+600000),610);assert.equal(finishTimer(legacy,start+600000).elapsed,610);
 assert.equal(countdownTarget({...timer,targetSeconds:-1}),null);assert.equal(countdownTarget({...timer,targetSeconds:86401}),null);assert.equal(countdownTarget({...timer,targetSeconds:60}),60);
});
it("restored completed timers retain their captured finish time",()=>{
 const done=finishTimer(timer,start+300000);assert.deepEqual(finishTimer(done,start+9999999),done);assert.equal(timerDisplay(done,start+9999999),0);
});
it("marking a task done caps its overdue countdown log without counting its activity mirror twice",()=>{
 const state=emptyAccount({id:"owner",user_metadata:{}});state.tasks=[{id:"task",title:"Focus",area:"do",category:"Work",completed:false}];
 const next=changeTaskStatus(state,"task","done",{...timer,taskId:"task"},start+900000,()=>"id");
 assert.equal(next.sessions.length,1);assert.equal(next.sessions[0].durationSeconds,300);assert.equal(next.sessions[0].endedAt,new Date(start+300000).toISOString());assert.equal(next.tasks[0].completed,true);
});
