import { it } from "node:test";
import assert from "node:assert/strict";
import { projectArea, projectsInArea, activeProjectsInArea, projectCounts, setProjectCompleted, editProjectSessionNote } from "../src/lib/prototype/projects";
import { finishSession } from "../src/lib/prototype/sessions";
import { emptyAccount } from "../src/lib/account/repository";
import { ActiveTimer, Project } from "../src/lib/prototype/types";
const project=(id:string,area?:"do"|"be"):Project=>({id,name:id,area,description:"",color:"sage",milestones:[]});
const timer:ActiveTimer={startedAt:"2026-11-05T10:00:00Z",endedAt:"2026-11-05T10:30:00Z",elapsed:300,runningSince:null};
it("keeps projects without an area in Do and filters before applying sidebar limits",()=>{
 const projects=[project("legacy"),...Array.from({length:4},(_,i)=>project("work"+i,"do")),project("reading","be")];
 assert.equal(projectArea(projects[0]),"do");assert.deepEqual(projectsInArea(projects,"be").slice(0,4).map(p=>p.id),["reading"]);assert.equal(projectsInArea(projects,"do").length,5);assert.equal(projects[0].area,undefined);
});
it("creates a Be project and its time entry in the same save",()=>{
 const state=emptyAccount({id:"owner",user_metadata:{}});let count=0;
 const saved=finishSession(state,timer,300,{title:"Read a chapter",area:"be",category:"Reading",note:"Learned something",newProjectName:"Reading list"},()=>String(++count));
 assert.equal(saved.projects[0].area,"be");assert.equal(saved.tasks.length,0);assert.equal(saved.projects[0].category,"Reading");assert.equal(saved.sessions[0].projectId,saved.projects[0].id);assert.equal(saved.activities[0].area,"be");
});
it("logs to an existing Be project and rejects project assignments from the wrong area",()=>{
 const state=emptyAccount({id:"owner",user_metadata:{}});state.projects=[project("work"),project("reading","be")];
 const saved=finishSession(state,timer,300,{title:"Read",area:"be",category:"Reading",projectId:"reading",note:""},()=>"session");assert.equal(saved.sessions[0].projectId,"reading");assert.equal(saved.sessions[0].area,"be");
 assert.throws(()=>finishSession(state,timer,300,{title:"Read",area:"be",category:"Reading",projectId:"work",note:""},()=>"bad"),/selected area/);
});

it("completes and reopens projects without losing history, and counts within each area",()=>{
 const state=emptyAccount({id:"owner",user_metadata:{}});state.projects=[project("work"),project("reading","be"),project("rest","be")];
 const complete=setProjectCompleted(state,"reading",true,"2026-11-08T12:00:00Z");
 assert.deepEqual(activeProjectsInArea(complete.projects,"be").map(p=>p.id),["rest"]);
 assert.deepEqual(projectCounts(complete.projects,"be"),{active:1,completed:1,percent:50});
 assert.deepEqual(projectCounts(complete.projects,"do"),{active:1,completed:0,percent:0});
 assert.deepEqual(projectCounts([],"be"),{active:0,completed:0,percent:0});
 assert.throws(()=>finishSession(complete,timer,300,{title:"Read",area:"be",category:"Reading",projectId:"reading",note:""},()=>"id"),/Reopen/);
 const reopened=setProjectCompleted(complete,"reading",false,"2026-11-08T13:00:00Z");assert.equal(reopened.projects[1].completedAt,undefined);assert.equal(state.projects[1].completedAt,undefined);
});
it("edits project session notes and their mirror without changing duration or attribution",()=>{
 let state=emptyAccount({id:"owner",user_metadata:{}});state.projects=[project("reading","be")];
 state=finishSession(state,timer,300,{title:"Read",area:"be",category:"Reading",projectId:"reading",note:""},()=>"log");
 const edited=editProjectSessionNote(state,"reading","log"," A useful chapter ");
 assert.equal(edited.sessions[0].note,"A useful chapter");assert.equal(edited.activities[0].note,"A useful chapter");assert.equal(edited.sessions[0].durationSeconds,300);assert.equal(edited.sessions[0].projectId,"reading");
 assert.equal(editProjectSessionNote(state,"other","log","bad"),state);
 assert.equal(editProjectSessionNote(state,"reading","log","x".repeat(1001)),state);
 assert.throws(()=>finishSession(state,timer,300,{title:"Task",area:"be",category:"Reading",projectId:"reading",createTask:true,note:""},()=>"bad"),/not tasks/);
});
