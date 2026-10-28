import { it } from "node:test";
import assert from "node:assert/strict";
import { emptyAccount } from "../src/lib/account/repository";
import { weeklySummary } from "../src/lib/prototype/weekly";
import { Activity } from "../src/lib/prototype/types";
const fresh = () => emptyAccount({ id: "owner", user_metadata: {} });
const activity = (id: string, date: string, projectId?: string): Activity => ({ id, date, projectId, title: "Real work", area: "do", category: "Work", kind: "activity", source: "manual", minutes: 10 });
const summary = (state: ReturnType<typeof fresh>) => weeklySummary(state, "2026-10-22", "2026-10-28");
it("counts only real activities inside the inclusive seven-day window", () => {
  const state=fresh();state.activities=[activity("first","2026-10-22"),activity("last","2026-10-28"),activity("same-day","2026-10-28"),activity("old","2026-10-21"),activity("future","2026-10-29"),{...activity("sample","2026-10-25"),source:"sample"}];
  const result=summary(state);assert.equal(result.recent.length,3);assert.equal(result.activeDays,2);
});
it("counts reflection dates once and excludes old and future entries", () => {
  const state=fresh();state.checkIns=["2026-10-21","2026-10-22","2026-10-22","2026-10-28","2026-10-29"].map((date,i)=>({id:String(i),date,mood:6,movedForward:"",reflection:{id:String(i),date,text:""}}));
  assert.equal(summary(state).checkInDays,2);
});
it("selects the actual project with the most logged time and counts its active days", () => {
  const state=fresh();state.projects=[{id:"not-portfolio",name:"My real project",description:"",color:"sage",milestones:[]},{id:"other",name:"Another",description:"",color:"sage",milestones:[]}];
  state.activities=[activity("one","2026-10-22","not-portfolio"),activity("two","2026-10-22","not-portfolio"),activity("three","2026-10-28","not-portfolio"),activity("other","2026-10-28","other"),{...activity("old","2026-10-21","other"),minutes:500}];
  const project=summary(state).project!;assert.equal(project.project.name,"My real project");assert.equal(project.days,2);assert.equal(project.minutes,30);
});
it("does not treat project/task creation or unrelated activity as project work", () => {
  const state=fresh();state.projects=[{id:"project",name:"Unstarted",description:"",color:"sage",milestones:[]}];state.tasks=[{id:"task",title:"Do someday",area:"do",category:"Work",projectId:"project",completed:false}];state.activities=[activity("unrelated","2026-10-28"),activity("deleted","2026-10-28","removed")];
  assert.equal(summary(state).project,undefined);
});
it("includes saved sessions without mirrors and never double-counts paired sessions", () => {
  const state=fresh();state.projects=[{id:"p",name:"Real focus",description:"",color:"sage",milestones:[]}];state.sessions=["one","two"].map(id=>({id,date:"2026-10-28",startedAt:"2026-10-28T09:00:00Z",durationSeconds:120,projectId:"p",note:""}));state.activities=[{...activity("session-one","2026-10-28"),minutes:2,kind:"session",source:"timer"}];
  const result=summary(state);assert.equal(result.recent.length,2);assert.equal(result.project?.minutes,4);assert.equal(result.project?.days,1);
});
it("keeps an empty week empty", () => {const result=summary(fresh());assert.equal(result.activeDays,0);assert.equal(result.checkInDays,0);assert.equal(result.project,undefined);});
