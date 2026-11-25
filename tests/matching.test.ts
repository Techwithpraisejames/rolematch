import test from "node:test";import assert from "node:assert/strict";import {deduplicate,rank} from "../lib/matching";import type {Evaluation} from "../lib/schemas";
test("deduplicates tracking variants",()=>assert.equal(deduplicate([{title:"a",url:"https://example.com/job?utm_source=test"},{title:"a",url:"https://example.com/job"}]).length,1));
const evaluation:Evaluation={id:0,title:"Engineer",company:"Example",location:"Remote",status:"listing",matched:["React"],missing:["Go"],unknown:[],reason:"Example"};
test("calculates evidence coverage and retains source URL",()=>{const result=rank([{title:"Engineer",url:"https://example.com/job"}],[evaluation]);assert.equal(result[0].score,50);assert.equal(result[0].url,"https://example.com/job");});
test("excludes closed and invented listings",()=>assert.equal(rank([{title:"Engineer",url:"https://example.com/job"}],[{...evaluation,status:"closed"},{...evaluation,id:99}]).length,0));
