import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AppError } from '@/lib/domain';
import { checkOrigin, failure, limitedForm, rateLimit, response, scope } from '@/lib/security';
import { audit, businessTx } from '@/lib/ledger';
export async function POST(request:NextRequest) {
  try {
    checkOrigin(request);const s=await scope(request);await rateLimit('file:'+s.actorId,20);
    if(Number(request.headers.get('content-length')??0)>5300000)throw new AppError('File exceeds 5 MB.',413);
    const form=await limitedForm(request,5300000);const file=form.get('file');const id=String(form.get('activityId')??'');
    if(!(file instanceof File)||file.size>5000000||file.size<8)throw new AppError('Attach a PDF, PNG or JPEG under 5 MB.');
    const bytes=Buffer.from(await file.arrayBuffer());
    const mime=bytes.subarray(0,5).toString()==='%PDF-'?'application/pdf':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':null;
    if(!mime||mime!==file.type)throw new AppError('File contents must match its PDF, PNG or JPEG type.');
    return response(await businessTx(s,async tx=>{
      if(!await tx.activity.findFirst({where:{id,businessId:s.businessId,voidedAt:null}}))throw new AppError('Record not found.',404);
      if(await tx.evidence.count({where:{businessId:s.businessId}})>=100)throw new AppError('Prototype limit: 100 private evidence files. Remove old files before adding more.');
      const evidence=await tx.evidence.create({data:{businessId:s.businessId,activityId:id,actorId:s.actorId,mime,bytes},select:{id:true}});await audit(tx,s,id,'evidence.attached',{evidenceId:evidence.id,method:'merchant-upload'});return evidence;
    }));
  }catch(error){return failure(error);}
}
export async function GET(request:NextRequest) {
  try {const s=await scope(request);const file=await db.evidence.findFirst({where:{id:request.nextUrl.searchParams.get('id')??'',businessId:s.businessId}});if(!file)throw new AppError('File not found.',404);
    return new Response(new Uint8Array(file.bytes),{headers:{'Content-Type':file.mime,'Content-Disposition':'attachment; filename="evidence.'+(file.mime==='application/pdf'?'pdf':file.mime==='image/png'?'png':'jpg')+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch(error){return failure(error);}
}
