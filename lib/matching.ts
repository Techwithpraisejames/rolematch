import type {SearchHit} from "./octen";
import type {Evaluation,Job} from "./schemas";
export function deduplicate(hits:SearchHit[]){
 const seen=new Set<string>();return hits.filter(h=>{try{const u=new URL(h.url);u.hash="";for(const k of [...u.searchParams.keys()])if(k.startsWith("utm_"))u.searchParams.delete(k);const key=u.href.replace(/\/$/,"");if(seen.has(key))return false;seen.add(key);return true;}catch{return false;}});
}
export function rank(hits:SearchHit[], evaluations:Evaluation[]):Job[]{
 const seen=new Set<number>();return evaluations.flatMap(e=>{
 const hit=hits[e.id];if(!hit||seen.has(e.id)||e.status!=="listing")return [];seen.add(e.id);
 const total=e.matched.length+e.missing.length+e.unknown.length;
 return [{...e,url:hit.url,evidence:hit.highlight||"",crawled:hit.time_last_crawled,score:total?Math.round(100*e.matched.length/total):null}];
 }).sort((a,b)=>(b.score??-1)-(a.score??-1));
}
