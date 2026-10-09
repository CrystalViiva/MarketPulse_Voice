import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { AppError, candidateSchema, currency, dateInput, lagosDate, moneyInput, kobo } from '@/lib/domain';
import { actor, body, checkOrigin, failure, rateLimit, response, scope } from '@/lib/security';
import { audit, businessTx, cancelDraft, confirmDraft, correctionDraft, createDraft, reviseDraft } from '@/lib/ledger';
import { confirmImport, matchPayment, previewImport } from '@/lib/imports';
import { createShare, report } from '@/lib/reports';
import { EnglishRulesInterpreter, interpretQuery } from '@/lib/providers';
const id=z.string().min(1).max(100);const key=z.string().min(8).max(100);
const actions=z.discriminatedUnion('action',[
  z.object({action:z.literal('onboard'),name:z.string().trim().min(2).max(80),mode:z.enum(['real','demo'])}),
  z.object({action:z.literal('draft'),candidate:candidateSchema,requestKey:key}),
  z.object({action:z.literal('interpret'),text:z.string().trim().min(3).max(2000),requestKey:key}),
  z.object({action:z.literal('revise'),id,version:z.number().int().positive(),candidate:candidateSchema}),
  z.object({action:z.literal('confirm'),id,version:z.number().int().positive(),confirmed:z.literal(true)}),
  z.object({action:z.literal('cancel'),id,version:z.number().int().positive()}),
  z.object({action:z.literal('correct'),id,reason:z.string().trim().min(5).max(300),requestKey:key}),
  z.object({action:z.literal('import-preview'),csv:z.string().max(256000)}),
  z.object({action:z.literal('import-confirm'),id,confirmed:z.literal(true)}),
  z.object({action:z.literal('match'),paymentId:id,activityId:id,settlementId:id.optional(),amount:moneyInput,method:z.enum(['corroborate','settle']),requestKey:key,acknowledgeConflict:z.boolean(),confirmed:z.literal(true)}),
  z.object({action:z.literal('share'),from:dateInput,to:dateInput,hours:z.number().int().min(1).max(168),confirmed:z.literal(true)}),
  z.object({action:z.literal('revoke'),id}),
  z.object({action:z.literal('query'),text:z.string().trim().min(2).max(500)}),
  z.object({action:z.literal('delete-evidence'),id}),
  z.object({action:z.literal('delete-private-data'),confirmed:z.literal(true)}),
  z.object({action:z.literal('validation'),consent:z.literal(true),participantId:z.string().regex(/^P-[A-Z0-9]{4,12}$/),language:z.enum(['en-NG','yo','ha','ig']),task:z.string().min(3).max(100),expectedAmount:moneyInput.nullable(),confirmedAmount:moneyInput.nullable(),result:z.string().max(300),correction:z.string().max(300),durationSeconds:z.number().int().min(1).max(7200),outcome:z.enum(['completed','assisted','failed']),feedback:z.string().max(500)}),
]);
export async function POST(request:NextRequest) {
  try {
    checkOrigin(request);const user=await actor(request);await rateLimit(user.id);
    const input=actions.parse(await body(request));
    if(input.action==='onboard'){
      const existing=await db.membership.findUnique({where:{userId:user.id}});if(existing)return response({ok:true});
      const business=await db.business.create({data:{name:input.name,mode:input.mode,memberships:{create:{userId:user.id}}}});return response({id:business.id});
    }
    const s=await scope(request);
    switch(input.action){
      case 'draft': if(input.candidate.source!=='manual')throw new AppError('Use the voice route for voice or fixture drafts.');return response(await createDraft(s,input.candidate,input.requestKey));
      case 'interpret':{
        const candidate=await new EnglishRulesInterpreter().interpret(input.text,'manual');return response(await createDraft(s,candidate,input.requestKey,input.text));
      }
      case 'revise':return response(await reviseDraft(s,input.id,input.version,input.candidate));
      case 'confirm':return response(await confirmDraft(s,input.id,input.version,input.confirmed));
      case 'cancel':return response(await cancelDraft(s,input.id,input.version));
      case 'correct':return response(await correctionDraft(s,input.id,input.reason,input.requestKey));
      case 'import-preview':return response(await previewImport(s,input.csv));
      case 'import-confirm':return response(await confirmImport(s,input.id));
      case 'match':return response(await matchPayment(s,input));
      case 'share':return response(await createShare(s,input.from,input.to,input.hours));
      case 'revoke':return response(await businessTx(s,async tx=>{const result=await tx.reportShare.updateMany({where:{id:input.id,businessId:s.businessId},data:{revokedAt:new Date()}});if(!result.count)throw new AppError('Report not found.',404);await audit(tx,s,input.id,'report.revoked');return {ok:true};}));
      case 'delete-evidence':return response(await businessTx(s,async tx=>{const result=await tx.evidence.deleteMany({where:{id:input.id,businessId:s.businessId}});if(!result.count)throw new AppError('File not found.',404);await audit(tx,s,input.id,'evidence.deleted');return {ok:true};}));
      case 'delete-private-data':return response(await businessTx(s,async tx=>{await tx.evidence.deleteMany({where:{businessId:s.businessId}});await tx.validationSession.deleteMany({where:{businessId:s.businessId}});await tx.draft.updateMany({where:{businessId:s.businessId},data:{transcript:null}});await tx.reportShare.deleteMany({where:{businessId:s.businessId}});await audit(tx,s,s.businessId,'private-material.deleted',{retained:'Confirmed ledger, draft versions, account and audit trail'});return {ok:true};}));
      case 'query':{
        const intent=interpretQuery(input.text);if(!intent)throw new AppError('Try today’s sales, this week’s cash received, spending, debts, today’s summary or correct last entry.');
        const today=lagosDate();const start=new Date(today+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
        const result=await report(s.businessId,intent==='week_receipts'?start.toISOString().slice(0,10):today,today);
        const answer=intent==='today_sales'?`Today’s recorded sales: ${currency(result.sales)}.`:intent==='week_receipts'?`Cash received since Monday: ${currency(result.receipts)}.`:intent==='spending'?`Today’s operating expenses: ${currency(result.operatingExpenses)}; inventory purchases: ${currency(result.inventoryPurchases)}.`:intent==='debts'?`Customers owe ${currency(result.customerDebt)}. You owe suppliers ${currency(result.supplierDebt)}.`:intent==='correct_last'?'Open the latest activity in Ledger and choose Correct entry. Existing payment links may require review.':`Today: sales ${currency(result.sales)}, cash received ${currency(result.receipts)}, cash paid ${currency(result.payments)}. Net cash movement ${currency(result.netCash)}; this is not profit.`;
        return response({intent,answer});
      }
      case 'validation':{
        const business=await db.business.findUniqueOrThrow({where:{id:s.businessId}});if(business.mode==='demo')throw new AppError('Real trader validation cannot be recorded in a demo business.');
        const {action: _action,consent: _consent,expectedAmount,confirmedAmount,...fields}=input;
        void _action;void _consent;
        const result=await db.validationSession.create({data:{...fields,businessId:s.businessId,consentAt:new Date(),expectedAmount:expectedAmount===null?null:kobo(expectedAmount),confirmedAmount:confirmedAmount===null?null:kobo(confirmedAmount)}});return response({id:result.id});
      }
    }
  }catch(error){return failure(error);}
}
