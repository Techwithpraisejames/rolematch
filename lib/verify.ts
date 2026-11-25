import type {SearchHit} from "./octen";
// Only known public ATS APIs are contacted. Never fetch arbitrary search-result URLs.
export async function verify(hit:SearchHit):Promise<SearchHit|null>{
 try{
 const u=new URL(hit.url);if(u.protocol!=="https:"||u.port||u.username||u.password)return null;
 const parts=u.pathname.split("/").filter(Boolean);
 const safe=(s:string)=>/^[a-zA-Z0-9_-]+$/.test(s);
 let endpoint:string,kind:string;
 if(["boards.greenhouse.io","job-boards.greenhouse.io"].includes(u.hostname)&&parts.length===3&&parts[1]==="jobs"&&safe(parts[0])&&/^\d+$/.test(parts[2])){
 endpoint="https://boards-api.greenhouse.io/v1/boards/"+parts[0]+"/jobs/"+parts[2]+"?content=true";kind="greenhouse";
 }else if(u.hostname==="jobs.lever.co"&&parts.length===2&&parts.every(safe)){
 endpoint="https://api.lever.co/v0/postings/"+parts[0]+"/"+parts[1]+"?mode=json";kind="lever";
 }else if(u.hostname==="jobs.ashbyhq.com"&&parts.length===2&&parts.every(safe)){
 endpoint="https://api.ashbyhq.com/posting-api/job-board/"+parts[0];kind="ashby";
 }else return null;
 const r=await fetch(endpoint,{redirect:"error",signal:AbortSignal.timeout(8000),cache:"no-store"});if(!r.ok)return null;
 let j=await r.json();
 if(kind==="ashby"){j=j.jobs?.find((x:any)=>x.isListed!==false&&typeof x.jobUrl==="string"&&new URL(x.jobUrl).pathname.replace(/\/$/,"")===u.pathname.replace(/\/$/,""));if(!j)return null;}
 if(kind==="greenhouse"&&String(j.id)!==parts[2])return null;
 if(kind==="lever"&&String(j.id)!==parts[1])return null;
 const title=j.title||j.text;if(typeof title!=="string")return null;
 const content=[j.location?.name,j.categories?.location,j.location,j.workplaceType,j.isRemote===true?"Remote":"",j.content,j.descriptionPlain,j.descriptionHtml,...(Array.isArray(j.lists)?j.lists.map((x:any)=>x.text+" "+x.content):[])].filter(x=>typeof x==="string").join(" ").replace(/<[^>]*>/g," ").replace(/&lt;|&gt;|&quot;|&amp;|&#\d+;/g," ").replace(/\s+/g," ").slice(0,10000);
 if(!content||/no longer accepting applications|this (job|position) (has been|is) closed|position has been filled/i.test(content))return null;
 return {...hit,title,highlight:content};
 }catch{return null;}
}
