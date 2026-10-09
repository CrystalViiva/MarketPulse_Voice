import { AppError, Candidate, emptyCandidate, lagosDate, normalizeCandidate } from './domain';
export interface TranscriptionProvider {
  identity: {provider:string;model:string};
  transcribe(audio:Buffer,language:string,fixtureId?:string):Promise<{text:string}>;
}
export interface InterpretationProvider { identity:{provider:string;model:string}; interpret(text:string,source:Candidate['source']):Promise<Candidate>; }
export interface SpeechProvider { speak(text:string,language:string):Promise<{audio:Buffer;mime:string}>; }
export const fixtures:Record<string,string>={
  ambiguous:'Sold five bags of rice, forty thousand.',
  credit:'Sold rice for 40000 total on credit to Amina today.',
  cash:'Sold tomatoes for 8500 total, fully paid today.',
  expense:'Spent 2500 total on transport, fully paid today.',
  query:'What are today’s sales?',
};
export class FixtureTranscriber implements TranscriptionProvider {
  identity={provider:'fixture',model:'scripted-demo-v1'};
  async transcribe(_audio:Buffer,language:string,fixtureId?:string) {
    if(language!=='en-NG'||!fixtureId||!fixtures[fixtureId]) throw new AppError('Choose a labelled English demo example.');
    return {text:fixtures[fixtureId]};
  }
}
export class UnavailableNatlasTranscriber implements TranscriptionProvider {
  identity={provider:'N-ATLAS-unavailable',model:'NCAIR1/NigerianAccentedEnglish'};
  async transcribe():Promise<{text:string}> { throw new AppError('Live N-ATLAS transcription is not connected. Your audio has not been sent to a provider. Keep the recording to retry, or use manual entry.',503); }
}
// A deliberately narrow, deterministic English parser. This is NOT N-ATLAS
// interpretation. Unknown values stay empty for merchant clarification.
export class EnglishRulesInterpreter implements InterpretationProvider {
  identity={provider:'local-rules',model:'english-bookkeeping-v1'};
  async interpret(text:string,source:Candidate['source']):Promise<Candidate> {
    const lower=text.toLowerCase(); const c=emptyCandidate(source);
    if(/refund|reverse|return(ed)?/.test(lower)) throw new AppError('Refunds and payment reversals need linked review and are not supported. No entry was saved.');
    c.type=/\bsold|\bsale/.test(lower)?'SALE':/\bspent|\bexpense/.test(lower)?'EXPENSE':/\bbought|\bpurchase/.test(lower)?'INVENTORY':/\bcollected|\brepaid/.test(lower)?'COLLECTION':/\bpaid supplier/.test(lower)?'SUPPLIER_PAYMENT':null;
    c.item=/rice/.test(lower)?'Rice':/tomato/.test(lower)?'Tomatoes':/transport/.test(lower)?'Transport':null;
    const q=lower.match(/\b(\d+(?:\.\d{1,3})?|five|two|three|one)\s+(bags?|crates?|kg|litres?)/);
    if(q) { c.quantity=({five:'5',two:'2',three:'3',one:'1'} as Record<string,string>)[q[1]]??q[1];c.unit=q[2]; }
    const explicitTotal=lower.match(/(?:for\s+)?(?:₦\s*)?(\d+(?:\.\d{1,2})?)\s*(?:naira\s*)?total/);
    if(explicitTotal)c.total=explicitTotal[1];
    const unit=lower.match(/(?:₦\s*)?(\d+(?:\.\d{1,2})?)\s*(?:naira\s*)?(?:each|per bag)/);
    if(unit)c.unitPrice=unit[1];
    if(/fully paid|paid in full|received all/.test(lower))c.paymentState='paid';
    else if(/on credit|unpaid|not paid/.test(lower))c.paymentState='unpaid';
    const partial=lower.match(/(?:received|paid)\s+(\d+(?:\.\d{1,2})?)/);
    if(partial){c.paymentState='partial';c.amountPaid=partial[1];}
    const alias=text.match(/(?:to|from)\s+([A-Z][a-zA-Z]{1,40})(?:\s|[.,]|$)/);if(alias)c.counterparty=alias[1];
    if(/\btoday\b/.test(lower))c.eventDate=lagosDate();
    const date=lower.match(/\b\d{4}-\d{2}-\d{2}\b/);if(date)c.eventDate=date[0];
    return normalizeCandidate(c);
  }
}
export const queryIntents=['today_sales','week_receipts','spending','debts','today_summary','correct_last'] as const;
export type QueryIntent=typeof queryIntents[number];
export function interpretQuery(text:string):QueryIntent|null {
  const t=text.toLowerCase();
  if(/correct.*last/.test(t))return 'correct_last';
  if(/summary/.test(t))return 'today_summary';
  if(/owe|debt/.test(t))return 'debts';
  if(/spend|spent|expense/.test(t))return 'spending';
  if(/week.*(cash|receiv)|(cash|receiv).*week/.test(t))return 'week_receipts';
  if(/today.*(sale|sell|sold)|(sale|sell|sold).*today/.test(t))return 'today_sales';
  return null;
}
export function validateWav(buffer:Buffer) {
  if(buffer.length>1000000||buffer.length<44||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')throw new AppError('Upload a PCM WAV file, at most 30 seconds / 1 MB.');
  let offset=12;let format=false;let duration=0;
  while(offset+8<=buffer.length){const name=buffer.toString('ascii',offset,offset+4);const size=buffer.readUInt32LE(offset+4);const start=offset+8;if(start+size>buffer.length)throw new AppError('Invalid WAV file.');
    if(name==='fmt '){if(size<16||buffer.readUInt16LE(start)!==1||buffer.readUInt16LE(start+2)!==1||buffer.readUInt32LE(start+4)!==16000||buffer.readUInt16LE(start+14)!==16)throw new AppError('Audio must be mono 16 kHz, 16-bit PCM WAV.');format=true;}
    if(name==='data')duration+=size/32000;offset=start+size+(size%2);
  }
  if(!format||duration<=0||duration>30)throw new AppError('Record between 1 and 30 seconds.');return duration;
}
