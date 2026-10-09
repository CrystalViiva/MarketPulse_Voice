'use client';
import { useState } from 'react';
import type { Candidate } from '@/lib/domain';
import type { ReportViewData } from './report-view';
export type DraftView = {
  id: string;
  version: number;
  state: string;
  candidate: Candidate;
  transcript: string | null;
  source: string;
  replacesId: string | null;
};
export type ActivityView = {
  id: string;
  type: string;
  item: string;
  amount: string;
  eventDate: string;
  counterparty: string | null;
  source: string;
  voidedAt: string | null;
  createdAt: string;
  replacesId: string | null;
};
export type SettlementView = {
  id: string;
  amount: string;
  eventDate: string;
  direction: string;
  counterparty: string | null;
  source: string;
  voidedAt: string | null;
  originActivityId: string | null;
};
export type Workspace = {
  user: { name: string };
  business: { id: string; name: string; mode: string } | null;
  summary: ReportViewData & { debt: (ActivityView & { remaining: string })[] };
  drafts: DraftView[];
  activities: ActivityView[];
  settlements: SettlementView[];
  allocations: { id: string; settlementId: string; activityId: string; amount: string }[];
  imports: {
    id: string;
    reference: string;
    eventDate: string;
    amount: string;
    direction: string;
    counterparty: string;
  }[];
  matches: { paymentId: string; settlementId: string; activityId: string; amount: string }[];
  shares: { id: string; expiresAt: string; revokedAt: string | null }[];
  evidence: { id: string; activityId: string; mime: string }[];
  audit: {
    id: string;
    entityId: string;
    action: string;
    createdAt: string;
    details: Record<string, unknown>;
  }[];
  validations: {
    outcome: string;
    durationSeconds: number;
    expectedAmount: string | null;
    confirmedAmount: string | null;
  }[];
  capabilities: { liveAsr: boolean; fixture: boolean; interpretation: string; speech: string };
};
export async function api<T>(payload: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Connection lost. Your draft is still here. Retry with the same action.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed. Please retry.');
  return data as T;
}
export function uploadForm<T>(
  url: string,
  form: FormData,
  phase: (text: string) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', url);
    request.timeout = 90000;
    phase('Uploading…');
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        phase(`Uploading… ${Math.round((event.loaded / event.total) * 100)}%`);
    };
    request.upload.onload = () => phase('Processing…');
    request.onerror = () =>
      reject(
        new Error('Connection lost. Your recording is still here. Retry or use manual entry.'),
      );
    request.ontimeout = () =>
      reject(new Error('Processing timed out. Your recording is still here for retry.'));
    request.onload = () => {
      try {
        const result = JSON.parse(request.responseText);
        if (request.status >= 200 && request.status < 300) resolve(result as T);
        else reject(new Error(result.error ?? 'Unable to process the recording. Please retry.'));
      } catch {
        reject(new Error('Unexpected server response. Your recording is still here for retry.'));
      }
    };
    request.send(form);
  });
}
export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError('');
    try {
      return await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please retry.');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}
export function Feedback({ error }: { error: string }) {
  return error ? (
    <div role="alert" className="notice error">
      {error}
    </div>
  ) : null;
}
export function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-symbol">◌</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export const typeLabels: Record<string, string> = {
  SALE: 'Sale',
  EXPENSE: 'Operating expense',
  INVENTORY: 'Inventory purchase',
  COLLECTION: 'Customer payment',
  SUPPLIER_PAYMENT: 'Supplier payment',
};
