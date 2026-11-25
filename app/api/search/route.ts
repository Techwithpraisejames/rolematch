import {NextResponse} from "next/server";
import {extractResume} from "../../../lib/resume";
import {discover} from "../../../lib/pipeline";
import {allowSearch} from "../../../lib/rate-limit";
export const runtime="nodejs";
export const maxDuration=180;
export async function POST(req:Request){
 try{
 if(Number(req.headers.get("content-length")||0)>4500000)return NextResponse.json({error:"Upload limit exceeded."},{status:413});
 if(!process.env.OPENAI_API_KEY||!process.env.OCTEN_API_KEY)return NextResponse.json({error:"Configure the server API keys to enable live search."},{status:503});
 const data=await req.formData();const file=data.get("resume");
 const role=String(data.get("role")||"").trim(),location=String(data.get("location")||"").trim(),work=String(data.get("work")||"");
 if(!(file instanceof File)||!role||role.length>120||!location||location.length>120||!["Remote","Hybrid","On-site","Any"].includes(work))return NextResponse.json({error:"Provide a resume, role, location and work preference."},{status:400});
 const ip=req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()||"local";
 if(!await allowSearch(ip))return NextResponse.json({error:"Live search is disabled or the daily allowance has been reached. Try the sample."},{status:429});
 const stream=new ReadableStream<Uint8Array>({async start(controller){
 const encoder=new TextEncoder();const send=(value:unknown)=>controller.enqueue(encoder.encode(JSON.stringify(value)+"\n"));
 try{send({stage:0});const resume=await extractResume(file);const result=await discover(resume,role,location,work,stage=>send({stage}));send({result});}
 catch(e){console.error("[RoleMatch] pipeline failed",e instanceof Error?e.name:"UnknownError");send({error:"We couldn't finish this search. Please try again."});}
 finally{controller.close();}
 }});
 return new Response(stream,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"no-store"}});
 }catch(e){
 if(process.env.NODE_ENV==="development"){
   console.error("[RoleMatch] Search failed", e instanceof Error ? {name:e.name,message:e.message,stack:e.stack} : {name:"UnknownError"});
 }
 return NextResponse.json({error:e instanceof Error&&/^(Choose|Upload|No readable|Search failed|OpenAI request|Missing OpenAI)/.test(e.message)?e.message:"Search could not be completed. Check the server configuration and retry."},{status:422});}
}
