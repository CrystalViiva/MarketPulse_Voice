import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from './auth';
import { db } from './db';
import { AppError, jsonSafe } from './domain';
import type { Scope } from './ledger';
export function checkOrigin(request:Request) {
  const origin=request.headers.get('origin');const expected=new URL(process.env.BETTER_AUTH_URL??'http://localhost:3000').origin;
  if(origin!==expected)throw new AppError('Request origin was not accepted. Reload the app at its configured address.',403);
}
export async function actor(request:Request) {
  const session=await auth.api.getSession({headers:request.headers});
  if(!session)throw new AppError('Sign in to continue.',401);return session.user;
}
export async function scope(request:Request):Promise<Scope> {
  const user=await actor(request);const membership=await db.membership.findUnique({where:{userId:user.id}});
  if(!membership)throw new AppError('Create your business first.',403);return {businessId:membership.businessId,actorId:user.id};
}
export async function rateLimit(key:string,max=80) {
  const now=new Date();const expiry=new Date(Date.now()+60000);
  const rows=await db.$queryRaw<{count:number}[]>`INSERT INTO "RateLimit" (key,count,"expiresAt") VALUES (${key},1,${expiry}) ON CONFLICT (key) DO UPDATE SET count=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit".count+1 END, "expiresAt"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN ${expiry} ELSE "RateLimit"."expiresAt" END RETURNING count`;
  if(rows[0].count>max)throw new AppError('Too many requests. Wait a minute and try again.',429);
}
export async function limitedBytes(request:Request,max:number) {
  if(Number(request.headers.get('content-length')??0)>max)throw new AppError('Request is too large.',413);
  const reader=request.body?.getReader();if(!reader)return new Uint8Array();
  const chunks:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();throw new AppError('Request is too large.',413);}chunks.push(value);}
  const result=new Uint8Array(total);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
export async function limitedForm(request:Request,max:number) {const bytes=await limitedBytes(request,max);return new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();}
export async function body(request:NextRequest) {
  if(Number(request.headers.get('content-length')??0)>300000)throw new AppError('Request is too large.',413);
  const raw=new TextDecoder().decode(await limitedBytes(request,300000));
  try{return JSON.parse(raw) as unknown;}catch{throw new AppError('Invalid request.');}
}
export function response(value:unknown,status=200) {return NextResponse.json(jsonSafe(value),{status,headers:{'Cache-Control':'private, no-store'}});}
export function failure(error:unknown) {
  if(error instanceof AppError)return response({error:error.message},error.status);
  if(error instanceof z.ZodError)return response({error:error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ').slice(0,400)},400);
  // Log class only: DB/provider exceptions may include personal data or URLs.
  console.error('marketpulse_request_failed',error instanceof Error?error.name:'Unknown');
  return response({error:'This request could not finish. Nothing was partially saved. Please retry or reload.'},500);
}
