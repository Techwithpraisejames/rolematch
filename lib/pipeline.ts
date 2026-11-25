import {generate} from "./openai";
import {searchJobs} from "./octen";
import {profileSchema,evaluationsSchema} from "./schemas";
import {deduplicate,rank} from "./matching";
import {verify} from "./verify";
export async function discover(resume:string,role:string,location:string,work:string,progress:(stage:number)=>void=()=>{}){
 progress(1);
 const profile=await generate("Extract professional skills and experience. Produce summary, skills and three distinct natural language searches for current individual vacancies. Include relevant alternative job titles. Do not use Boolean operators or site restrictions. Never include private information.",{resume,role,location,work},profileSchema);
 progress(2);
 const queries=profile.queries.map(q=>q.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,"").slice(0,300));
 const batches=await Promise.allSettled(queries.map(async q=>{try{return await searchJobs(q+" job apply",10)}catch{return await searchJobs(q+" careers",10)}}));
 if(batches.every(b=>b.status==="rejected"))throw new Error("Search failed. Please try again later.");
 const candidates=deduplicate(batches.flatMap(b=>b.status==="fulfilled"?b.value:[])).slice(0,30);
 progress(3);
 const hits=[];for(let i=0;i<candidates.length&&hits.length<12;i+=10){const checked=await Promise.all(candidates.slice(i,i+10).map(verify));for(const h of checked)if(h)hits.push(h);}
 const verified=hits.slice(0,12);
 if(!verified.length)return {jobs:[],queries,partial:batches.some(b=>b.status==="rejected")};
 progress(4);
 const evaluations=await generate("Evaluate verified employer job descriptions against the candidate profile and preferences. Reject incompatible locations or work arrangements; for Remote require explicit remote evidence and compatible geography. Use listing only for relevant roles with supported preferences. Write reason in second person, one concise sentence explaining concrete overlap, no phrases like individual vacancy or excerpt. Use short skill phrases in matched, missing and unknown; missing means explicit unmet requirement, unknown means insufficient evidence. Do not put location or work arrangement in skill arrays. Use actual company and location or Not specified. Return original zero-based id.",{profile:{skills:profile.skills,summary:profile.summary},role,location,work,hits:verified.map((h,id)=>({id,title:h.title,url:h.url,evidence:h.highlight}))},evaluationsSchema);
 return {jobs:rank(verified,evaluations.jobs),queries,partial:batches.some(b=>b.status==="rejected")};
}
