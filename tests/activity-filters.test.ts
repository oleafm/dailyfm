import { it } from "node:test";
import assert from "node:assert/strict";
import { activityFilterOptions, filterActivityHistory } from "../src/lib/prototype/activity-filters";
import { Activity, Project } from "../src/lib/prototype/types";
const projects:Project[]=[{id:"work",name:"Work",description:"",color:"sage",milestones:[]},{id:"books",name:"Books",area:"be",category:"Reading",completedAt:"2026-11-01",description:"",color:"sage",milestones:[]}];
const activities:Activity[]=[
 {id:"a",area:"do",projectId:"work",category:"Admin",title:"A",date:"2026-11-12",minutes:5,kind:"session",source:"timer"},
 {id:"b",area:"do",projectId:"work",category:"Create",title:"B",date:"2026-11-11",minutes:10,kind:"session",source:"timer"},
 {id:"c",area:"be",projectId:"books",category:"Reading",title:"C",date:"2026-11-12",minutes:15,kind:"session",source:"timer"},
 {id:"d",area:"be",category:"Rest",title:"D",date:"2026-11-10",minutes:20,kind:"activity",source:"manual"},
 {id:"e",area:"do",category:"Legacy category",title:"E",date:"2026-11-10",minutes:20,kind:"activity",source:"manual"},
];
it("scopes project and category choices to the area, includes legacy Do and completed project history",()=>{
 const work=activityFilterOptions(activities,projects,"do"),life=activityFilterOptions(activities,projects,"be");
 assert.deepEqual(work.projects.map(p=>p.id),["work"]);assert.deepEqual(life.projects.map(p=>p.id),["books"]);
 assert(work.categories.includes("Legacy category"));assert(!work.categories.includes("Reading"));assert(life.categories.includes("Reading"));assert(!life.categories.includes("Admin"));assert(!life.categories.includes("Legacy category"));
});
it("intersects area, project and category without changing the source records",()=>{
 const filters={area:"do" as const,projectId:"work",category:"Admin"};assert.deepEqual(filterActivityHistory(activities,filters).map(a=>a.id),["a"]);
 assert.deepEqual(filterActivityHistory(activities,{...filters,category:""}).map(a=>a.id),["a","b"]);
 assert.equal(filterActivityHistory(activities,{...filters,category:"Reading"}).length,0);
 assert.equal(filterActivityHistory(activities,{area:"be",projectId:"work",category:""}).length,0);
 assert.deepEqual(filterActivityHistory(activities,{area:"be",projectId:"",category:""}).map(a=>a.id),["c","d"]);
 assert.equal(activities.length,5);assert.equal(activities[0].projectId,"work");
});
it("supports categories without a project and empty areas",()=>{
 assert.deepEqual(filterActivityHistory(activities,{area:"be",projectId:"",category:"Rest"}).map(a=>a.id),["d"]);
 assert.equal(activityFilterOptions([],[],"be").projects.length,0);
 assert(activityFilterOptions([],[],"be").categories.includes("Reading"));
});
