import { z } from "zod";
export const profileSchema = z.object({skills:z.array(z.string()),summary:z.string(),queries:z.array(z.string()).min(1).max(3)});
export const evaluationsSchema = z.object({jobs:z.array(z.object({id:z.number().int(),title:z.string(),company:z.string(),location:z.string(),status:z.enum(["listing","closed","uncertain","not_listing"]),matched:z.array(z.string()),missing:z.array(z.string()),unknown:z.array(z.string()),reason:z.string()}))});
export type Evaluation = z.infer<typeof evaluationsSchema>["jobs"][number];
export type Job = Evaluation & {url:string; score:number|null; evidence:string; crawled?:string};
