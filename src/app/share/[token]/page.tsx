import { readShare } from '@/lib/reports';
import { ReportView, ReportViewData } from '@/components/report-view';
import { PrintButton } from '@/components/print-button';
export const dynamic='force-dynamic';
export default async function SharePage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  try{const snapshot=await readShare(token);return <main className="shared-report"><div className="share-brand"><strong>◒ MarketPulse <span>Voice</span></strong><PrintButton/></div><ReportView report={snapshot as unknown as ReportViewData} lender/></main>;}catch{return <main className="shared-report"><h1>This report link is unavailable</h1><p>It may have expired or been revoked. Ask the merchant for a new link.</p></main>;}
}
