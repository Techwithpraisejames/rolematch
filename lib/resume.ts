import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
export async function extractResume(file:File){
 if(file.size>4*1024*1024||file.size===0) throw new Error("Choose a non-empty file under 4 MB.");
 const bytes=Buffer.from(await file.arrayBuffer());
 let text:string;
 if(file.name.toLowerCase().endsWith(".pdf")&&bytes.subarray(0,5).toString()==="%PDF-"){
 const parser=new PDFParse({data:bytes});try{text=(await parser.getText()).text;}finally{await parser.destroy();}
 }else if(file.name.toLowerCase().endsWith(".docx")&&bytes.subarray(0,2).toString()==="PK"){
 text=(await mammoth.extractRawText({buffer:bytes})).value;
 }else throw new Error("Upload a PDF or DOCX resume.");
 if(text.trim().length<30) throw new Error("No readable resume text. Use a text-based PDF or DOCX.");
 return text.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,"[email removed]").replace(/\+?\d[\d ()-]{8,}\d/g,"[number removed]").slice(0,18000);
}
