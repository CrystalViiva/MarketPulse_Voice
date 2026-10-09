import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { AppError, dateInput, jsonSafe } from './domain';
import { audit, businessTx, Scope, Tx } from './ledger';
async function buildReport(businessId:string,from:string,to:string,tx:Tx) {
  dateInput.parse(from);dateInput.parse(to);
  if(from>to) throw new AppError('Start date must be on or before end date.');
  const [business,activities,payments,allocations,evidence,matches,imports]=await Promise.all([
    tx.business.findUniqueOrThrow({where:{id:businessId}}),
    tx.activity.findMany({where:{businessId,voidedAt:null,eventDate:{lte:to}},orderBy:[{eventDate:'desc'},{createdAt:'desc'}]}),
    tx.settlement.findMany({where:{businessId,voidedAt:null,eventDate:{lte:to}}}),
    tx.allocation.findMany({where:{businessId,voidedAt:null}}),
    tx.evidence.findMany({where:{businessId},select:{id:true,activityId:true,source:true,createdAt:true}}),
    tx.match.findMany({where:{businessId}}),tx.importedPayment.findMany({where:{businessId,eventDate:{gte:from,lte:to}}}),
  ]);
  const inPeriod=activities.filter(a=>a.eventDate>=from);
  const cash=payments.filter(p=>p.eventDate>=from);
  const activePayments=new Set(payments.map(p=>p.id));
  const debt=activities.map(a=>({...a,remaining:a.amount-allocations.filter(x=>x.activityId===a.id&&activePayments.has(x.settlementId)).reduce((n,x)=>n+x.amount,0n)})).filter(a=>a.remaining>0n);
  const documentIds=new Set(evidence.map(e=>e.activityId));
  const paymentIds=new Set(matches.filter(m=>activePayments.has(m.settlementId)).map(m=>m.activityId));
  const supportedIds=new Set([...documentIds,...paymentIds]);
  const sales=inPeriod.filter(a=>a.type==='SALE').reduce((n,a)=>n+a.amount,0n);
  const receipts=cash.filter(p=>p.direction==='IN').reduce((n,p)=>n+p.amount,0n);
  const paid=cash.filter(p=>p.direction==='OUT').reduce((n,p)=>n+p.amount,0n);
  const rows=inPeriod.map(a=>({...a,label:paymentIds.has(a.id)?'payment-matched':documentIds.has(a.id)?'document-supported':'self-reported'}));
  return jsonSafe({business:{name:business.name,mode:business.mode},from,to,generatedAt:new Date().toISOString(),sales,receipts,payments:paid,netCash:receipts-paid,
    operatingExpenses:inPeriod.filter(a=>a.type==='EXPENSE').reduce((n,a)=>n+a.amount,0n),inventoryPurchases:inPeriod.filter(a=>a.type==='INVENTORY').reduce((n,a)=>n+a.amount,0n),
    customerDebt:debt.filter(a=>a.type==='SALE').reduce((n,a)=>n+a.remaining,0n),supplierDebt:debt.filter(a=>a.type!=='SALE').reduce((n,a)=>n+a.remaining,0n),
    coverage:{eligibleRecords:inPeriod.length,supportedRecords:inPeriod.filter(a=>supportedIds.has(a.id)).length,documentRecords:inPeriod.filter(a=>documentIds.has(a.id)).length,paymentRecords:inPeriod.filter(a=>paymentIds.has(a.id)).length,eligibleAmount:inPeriod.reduce((n,a)=>n+a.amount,0n),supportedRecordAmount:inPeriod.filter(a=>supportedIds.has(a.id)).reduce((n,a)=>n+a.amount,0n),matchedPaymentAmount:matches.filter(m=>inPeriod.some(a=>a.id===m.activityId)&&activePayments.has(m.settlementId)).reduce((n,m)=>n+m.amount,0n)},
    unresolvedPayments:imports.filter(p=>matches.filter(m=>m.paymentId===p.id).reduce((n,m)=>n+m.amount,0n)<p.amount).length,
    rows,debt,limitations:['Merchant-recorded activity; completeness is unknown.','Uploaded documents and CSV payments are not bank-verified.','Cash movement is not profit or a measure of repayment capacity.','Debts are balances as of the period end; opening debts before use are not known.','Coverage counts each activity once. Supported record value does not mean its full value is verified.'],
  });
}
export function report(businessId:string,from:string,to:string,tx?:Tx) {
  return tx?buildReport(businessId,from,to,tx):db.$transaction(reader=>buildReport(businessId,from,to,reader),{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead});
}
export type Report = Awaited<ReturnType<typeof report>>;
export async function createShare(s:Scope,from:string,to:string,hours:number) {
  return businessTx(s,async tx=>{
    const snapshot=await report(s.businessId,from,to,tx);
    // The lender receives aggregates and evidence labels, never files, aliases,
    // transcripts, account identifiers or routes into the merchant workspace.
    const safe={...snapshot,rows:snapshot.rows.map(a=>({type:a.type,eventDate:a.eventDate,amount:a.amount,label:a.label})),debt:undefined};
    const token=randomBytes(32).toString('base64url');
    const share=await tx.reportShare.create({data:{businessId:s.businessId,tokenHash:createHash('sha256').update(token).digest('hex'),snapshot:jsonSafe(safe) as unknown as Prisma.InputJsonValue,expiresAt:new Date(Date.now()+hours*3600000)}});
    await audit(tx,s,share.id,'report.shared',{from,to,hours}); return {id:share.id,token,expiresAt:share.expiresAt};
  });
}
export async function readShare(token:string) {
  if(!/^[\w-]{43}$/.test(token)) throw new AppError('Report link is unavailable or expired.',404);
  const share=await db.reportShare.findUnique({where:{tokenHash:createHash('sha256').update(token).digest('hex')}});
  if(!share||share.revokedAt||share.expiresAt<=new Date()) throw new AppError('Report link is unavailable or expired.',404);
  return share.snapshot;
}
