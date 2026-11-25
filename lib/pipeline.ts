import {generate} from "./openai";
import {searchJobs} from "./octen";
import {profileSchema,evaluationsSchema} from "./schemas";
import {deduplicate,rank} from "./matching";
export async function discover(resume:string,role:string,location:string,work:string){
 const profile=await generate("Extract professional skills and experience. Produce summary, skills and up to three public web search queries for individual current job vacancies. Never include names, contact details or other private resume information in queries. Respect location and work arrangement.",{resume,role,location,work},profileSchema);
 const queries=profile.queries.map(q=>q.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,"").slice(0,350));
 const batches=await Promise.allSettled(queries.map(q=>searchJobs(q+" job vacancy apply",8)));
 const hits=deduplicate(batches.flatMap(b=>b.status==="fulfilled"?b.value:[])).slice(0,18);
 if(batches.every(b=>b.status==="rejected"))throw new Error("Search failed. Check your Octen configuration.");
 if(!hits.length)return {jobs:[],queries,partial:batches.some(b=>b.status==="rejected")};
 const evaluations=await generate("Evaluate search excerpts against professional skills and stated preferences. Return jobs array with id (original zero-based index), title, company, location, status (listing, closed, uncertain, not_listing), matched, missing, unknown and reason. Only mark listing when the evidence shows an individual relevant vacancy, not a search page or article. Discard explicit closed listings and incompatible location or work arrangement. Use unknown for unverified requirements; do not invent facts. A listing status is not proof that applications remain open.",{profile:{skills:profile.skills,summary:profile.summary},role,location,work,hits:hits.map((h,id)=>({id,title:h.title,url:h.url,evidence:String(h.highlight||"").slice(0,1600)}))},evaluationsSchema);
 return {jobs:rank(hits,evaluations.jobs),queries,partial:batches.some(b=>b.status==="rejected")};
}
