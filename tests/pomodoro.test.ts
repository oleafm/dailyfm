import { it } from "node:test";
import assert from "node:assert/strict";
import { advancePomodoro, pomodoroPhaseElapsed, savePomodoroLogs, stopPomodoro, validPomodoroSettings } from "../src/lib/prototype/pomodoro";
import { finishTimer, timerDisplay, timerElapsed } from "../src/lib/prototype/active-timer";
import { emptyAccount } from "../src/lib/account/repository";
import { ActiveTimer } from "../src/lib/prototype/types";
const start=Date.parse("2026-11-12T23:59:00Z");
const timer=(focus=60,rest=60,rounds=2):ActiveTimer=>({mode:"pomodoro",startedAt:new Date(start).toISOString(),elapsed:0,runningSince:start,pomodoro:{focusSeconds:focus,breakSeconds:rest,totalSessions:rounds,phase:"focus",session:1,phaseStartedAt:new Date(start).toISOString(),logs:[]}});
it("alternates 25/5/4 automatically and ends after the fourth focus without a final break",()=>{
 const t=timer(1500,300,4),rest=advancePomodoro(t,start+1500000),focus=advancePomodoro(rest,start+1800000),end=advancePomodoro(t,start+6900000);
 assert.equal(rest.pomodoro?.phase,"break");assert.equal(rest.pomodoro?.logs.length,1);assert.equal(focus.pomodoro?.phase,"focus");assert.equal(focus.pomodoro?.session,2);
 assert.equal(end.countdownCompleted,true);assert.equal(end.pomodoro?.logs.length,4);assert.equal(timerElapsed(end,start+99999999),6000);assert.equal(timerDisplay(end,start+99999999),0);assert.equal(end.endedAt,new Date(start+6900000).toISOString());
});
it("recovers missed transitions by timestamps, is idempotent, and excludes breaks",()=>{
 const t=timer(),end=advancePomodoro(t,start+9999999);assert.equal(end.pomodoro?.logs.length,2);assert.equal(end.endedAt,new Date(start+180000).toISOString());assert.equal(timerElapsed(t,start+100000),60);assert.equal(timerDisplay(t,start+100000),20);assert.equal(advancePomodoro(end,start+99999999),end);
});
it("pauses focus without consuming time and retains the real phase interval",()=>{
 const paused={...timer(),elapsed:30,runningSince:null};assert.equal(pomodoroPhaseElapsed(paused,start+1000000),30);assert.equal(timerDisplay(paused,start+1000000),30);
 const resumed={...paused,runningSince:start+150000};const rest=advancePomodoro(resumed,start+180000);assert.equal(rest.pomodoro?.phase,"break");assert.equal(rest.pomodoro?.logs[0].durationSeconds,60);assert.equal(rest.pomodoro?.logs[0].endedAt,new Date(start+180000).toISOString());
});
it("pauses breaks and preserves completed logs when stopping during a break",()=>{
 const rest=advancePomodoro(timer(),start+60000);const paused={...rest,elapsed:10,runningSince:null};assert.equal(timerDisplay(paused,start+1000000),50);
 const stopped=stopPomodoro(paused,start+1000000);assert.equal(stopped.pomodoro?.logs.length,1);assert.equal(timerElapsed(stopped,start+1000000),60);
});
it("includes a partial focus log on early finish, and no zero-length or break logs",()=>{
 const end=finishTimer(timer(),start+20000);assert.equal(end.countdownCompleted,true);assert.equal(end.pomodoro?.logs[0].durationSeconds,20);assert.equal(end.pomodoro?.logs[0].completed,false);assert.equal(stopPomodoro(timer(),start).pomodoro?.logs.length,0);
});
it("saves only selected logs, creating their shared project and task once",()=>{
 const end=advancePomodoro(timer(60,60,3),start+300000);let id=0;const state=emptyAccount({id:"owner",user_metadata:{}}),logs=end.pomodoro!.logs;
 const saved=savePomodoroLogs(state,end,{title:"Deep work",area:"do",category:"Work",newProjectName:"Build",createTask:true,note:"Progress",pomodoroLogs:[{id:logs[0].id,durationSeconds:60},{id:logs[2].id,durationSeconds:30}]},()=>String(++id));
 assert.equal(saved.projects.length,1);assert.equal(saved.tasks.length,1);assert.equal(saved.sessions.length,2);assert.equal(saved.activities.length,2);assert.equal(saved.sessions[0].projectId,saved.sessions[1].projectId);assert.equal(saved.sessions[0].taskId,saved.sessions[1].taskId);assert.equal(saved.sessions[1].durationAdjusted,true);assert.equal(saved.sessions[1].originalDurationSeconds,60);assert.equal(saved.sessions[1].note,"Progress");assert.equal(saved.tasks[0].completed,false);assert.equal(saved.sessions[1].date,"2026-11-13");assert.equal(state.sessions.length,0);
});
it("rejects empty, duplicate or inflated selections without altering state",()=>{
 const end=advancePomodoro(timer(),start+180000),log=end.pomodoro!.logs[0];const state=emptyAccount({id:"owner",user_metadata:{}});const details={title:"Focus",area:"do" as const,category:"Work",note:""};
 for(const selection of [[],[{id:"missing",durationSeconds:60}],[{id:log.id,durationSeconds:61}],[{id:log.id,durationSeconds:60},{id:log.id,durationSeconds:60}]])assert.throws(()=>savePomodoroLogs(state,end,{...details,pomodoroLogs:selection},()=>"id"));assert.equal(state.sessions.length,0);
});
it("validates focus, break and session settings",()=>{assert(validPomodoroSettings({focusSeconds:1500,breakSeconds:300,totalSessions:4}));for(const invalid of [{focusSeconds:0,breakSeconds:300,totalSessions:4},{focusSeconds:1500,breakSeconds:0,totalSessions:4},{focusSeconds:1500,breakSeconds:300,totalSessions:0}])assert(!validPomodoroSettings(invalid));});
