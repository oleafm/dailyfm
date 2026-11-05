import { it } from "node:test";
import assert from "node:assert/strict";
import { historyGeometry, historyWindow, historyYears } from "../src/lib/prototype/activity-history";
it("offers year filtering only after the registration anniversary",()=>{
  const registered="2025-11-05T10:00:00Z";
  assert.deepEqual(historyYears(registered,new Date("2026-11-05T10:00:00Z")),[]);
  assert.deepEqual(historyYears(registered,new Date("2026-11-05T10:00:00.001Z")),[2026,2025]);
  assert.deepEqual(historyYears("2023-06-01T12:00:00Z",new Date("2026-11-05T12:00:00Z")),[2026,2025,2024,2023]);
  for(const invalid of [undefined,"invalid","2030-01-01T00:00:00Z"])assert.deepEqual(historyYears(invalid,new Date("2026-11-05T12:00:00Z")),[]);
});
it("builds 8/16/26/52 Monday-aligned weeks and excludes future days from the visible period",()=>{
  for(const weeks of [8,16,26,52]){const range=historyWindow("2026-11-05",weeks);assert.equal(range.days.length,weeks*7);assert.equal(range.columns,weeks);assert.equal(new Date(range.days[0]+"T12:00:00").getDay(),1);assert.equal(range.visibleEnd,"2026-11-05");assert.equal(new Set(range.days).size,range.days.length);}
});
it("includes every day of a selected calendar year, including leap day and both year boundaries",()=>{
  for(const year of [2023,2024,2025,2012]){const range=historyWindow("2026-11-05",52,year);const actual=range.days.filter(d=>d>=range.visibleStart&&d<=range.visibleEnd);assert.equal(actual[0],`${year}-01-01`);assert.equal(actual.at(-1),`${year}-12-31`);assert.equal(actual.length,year%4===0?366:365);assert.equal(range.days.length%7,0);}
  assert(historyWindow("2026-11-05",52,2024).days.includes("2024-02-29"));
  assert.equal(historyWindow("2026-11-05",52,2012).columns,54);
});
it("keeps the current calendar year bounded by today",()=>{const range=historyWindow("2026-11-05",26,2026);assert.equal(range.visibleStart,"2026-01-01");assert.equal(range.visibleEnd,"2026-11-05");assert(range.days.includes("2026-12-31"));});
it("keeps the frame height unchanged while square cells fit every range",()=>{
  for(const [width,reference] of [[260,16],[650,26]]){const initial=historyGeometry(width,reference,4,reference);for(const columns of [8,16,26,52,53,54]){const geometry=historyGeometry(width,reference,4,columns);assert.equal(geometry.height,initial.height);assert(geometry.cell>0);assert(geometry.cell*columns+geometry.gap*(columns-1)<=width+.001);assert(geometry.cell<=(geometry.height-24)/7+.001);}}
});
it("rejects unsupported ranges and invalid calendar dates",()=>{assert.throws(()=>historyWindow("2026-02-30",26));assert.throws(()=>historyWindow("2026-11-05",1));assert.throws(()=>historyWindow("2026-11-05",52,2027));});
