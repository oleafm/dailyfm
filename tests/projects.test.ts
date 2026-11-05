import { it } from "node:test";
import assert from "node:assert/strict";
import { projectArea, projectsInArea } from "../src/lib/prototype/projects";
import { finishSession } from "../src/lib/prototype/sessions";
import { emptyAccount } from "../src/lib/account/repository";
import { ActiveTimer, Project } from "../src/lib/prototype/types";
const project=(id:string,area?:"do"|"be"):Project=>({id,name:id,area,description:"",color:"sage",milestones:[]});
const timer:ActiveTimer={startedAt:"2026-11-05T10:00:00Z",endedAt:"2026-11-05T10:30:00Z",elapsed:300,runningSince:null};
it("keeps projects without an area in Do and filters before applying sidebar limits",()=>{
 const projects=[project("legacy"),...Array.from({length:4},(_,i)=>project("work"+i,"do")),project("reading","be")];
 assert.equal(projectArea(projects[0]),"do");assert.deepEqual(projectsInArea(projects,"be").slice(0,4).map(p=>p.id),["reading"]);assert.equal(projectsInArea(projects,"do").length,5);assert.equal(projects[0].area,undefined);
});
it("creates a Be project and its task/time entry in the same save",()=>{
 const state=emptyAccount({id:"owner",user_metadata:{}});let count=0;
 const saved=finishSession(state,timer,300,{title:"Read a chapter",area:"be",category:"Reading",note:"Learned something",newProjectName:"Reading list",createTask:true},()=>String(++count));
 assert.equal(saved.projects[0].area,"be");assert.equal(saved.tasks[0].area,"be");assert.equal(saved.tasks[0].projectId,saved.projects[0].id);assert.equal(saved.sessions[0].projectId,saved.projects[0].id);assert.equal(saved.activities[0].area,"be");assert.equal(saved.tasks[0].completed,false);
});
it("logs to an existing Be project and rejects project assignments from the wrong area",()=>{
 const state=emptyAccount({id:"owner",user_metadata:{}});state.projects=[project("work"),project("reading","be")];
 const saved=finishSession(state,timer,300,{title:"Read",area:"be",category:"Reading",projectId:"reading",note:""},()=>"session");assert.equal(saved.sessions[0].projectId,"reading");assert.equal(saved.sessions[0].area,"be");
 assert.throws(()=>finishSession(state,timer,300,{title:"Read",area:"be",category:"Reading",projectId:"work",note:""},()=>"bad"),/selected area/);
});
