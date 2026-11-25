import {createHash} from "node:crypto";
const counts=new Map<string,number>();
export async function allowSearch(ip:string){
 if(process.env.LIVE_SEARCH_ENABLED!=="true")return false;
 const hosted=process.env.HOSTED_DEMO==="true"||!!process.env.VERCEL;
 const day=new Date().toISOString().slice(0,10);
 const key="rolematch:"+day+":"+createHash("sha256").update(ip).digest("hex");
 const globalKey="rolematch:"+day+":global";
 const limit=Number(process.env.DAILY_GLOBAL_LIMIT||30);
 if(!Number.isSafeInteger(limit)||limit<1)return false;
 if(hosted){
 const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token)return false;
 const script="local a=tonumber(redis.call('GET',KEYS[1]) or '0'); local b=tonumber(redis.call('GET',KEYS[2]) or '0'); if a>=3 or b>=tonumber(ARGV[1]) then return 0 end; redis.call('INCR',KEYS[1]); redis.call('EXPIRE',KEYS[1],172800); redis.call('INCR',KEYS[2]); redis.call('EXPIRE',KEYS[2],172800); return 1";
 const r=await fetch(url,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(["EVAL",script,2,key,globalKey,limit]),signal:AbortSignal.timeout(5000)});
 if(!r.ok)return false;return (await r.json()).result===1;
 }
 for(const k of counts.keys())if(!k.includes(day))counts.delete(k);
 if((counts.get(key)||0)>=3||(counts.get(globalKey)||0)>=limit)return false;
 for(const k of [key,globalKey])counts.set(k,(counts.get(k)||0)+1);return true;
}
