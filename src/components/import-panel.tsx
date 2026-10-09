'use client';
import { useRef, useState } from 'react';
import { FileUp, Link2 } from 'lucide-react';
import { currency, naira } from '@/lib/domain';
import { api, Empty, Feedback, useTask, Workspace } from './client-shared';
type Preview = {
  id: string;
  state: string;
  rows: {
    reference: string;
    date: string;
    direction: string;
    amount: string;
    counterparty: string;
    status: string;
  }[];
};
export function ImportPanel({ data, refresh }: { data: Workspace; refresh: () => Promise<void> }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState('');
  const [activityId, setActivityId] = useState('');
  const [method, setMethod] = useState('corroborate');
  const t = useTask();
  const matchKey = useRef('');
  const payment = data.imports.find((p) => p.id === selected);
  const activity = data.activities.find((a) => a.id === activityId);
  const used = payment
    ? data.matches
        .filter((m) => m.paymentId === payment.id)
        .reduce((n, m) => n + BigInt(m.amount), 0n)
    : 0n;
  const settlements = data.settlements.filter(
    (p) =>
      !p.voidedAt &&
      data.allocations.some((a) => a.activityId === activityId && a.settlementId === p.id),
  );
  return (
    <>
      <section className="card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BRING YOUR PAYMENTS TOGETHER</span>
            <h3>Import, review, then reconcile.</h3>
          </div>
          <FileUp size={27} />
        </div>
        <p className="muted">
          Upload the five-column CSV template. Incoming payments stay unmatched until you review
          them. They are never automatically counted as sales.
        </p>
        <a className="text-button" href="/payments-template.csv" download>
          Download example CSV template
        </a>
        <p className="small muted">
          Columns: reference, date, direction, amount, counterparty. Use unique transfer references,
          YYYY-MM-DD, IN/OUT and plain naira (15000.00). Up to 500 rows / 256 KB. Template rows are
          synthetic.
        </p>
        <label className="upload-zone">
          <FileUp size={24} />
          <strong>Choose a payment CSV</strong>
          <small>Preview before anything is imported</small>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={t.busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void t.run(async () => {
                  if (file.size > 256000) throw new Error('CSV must be under 256 KB.');
                  setPreview(
                    await api<Preview>({ action: 'import-preview', csv: await file.text() }),
                  );
                  setNotice('');
                });
              e.target.value = '';
            }}
          />
        </label>
        <Feedback error={t.error} />
        {notice && (
          <div className="notice success" role="status">
            {notice}
          </div>
        )}
        {preview && (
          <div>
            <h3>Import preview</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Amount (₦)</th>
                    <th>Direction</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.reference}>
                      <td>{r.reference}</td>
                      <td>{r.date}</td>
                      <td>{r.amount}</td>
                      <td>{r.direction}</td>
                      <td>
                        <span className="badge neutral">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="primary"
              disabled={
                t.busy ||
                preview.state === 'confirmed' ||
                preview.rows.some((r) => r.status === 'conflict')
              }
              onClick={() =>
                void t.run(async () => {
                  const result = await api<{ created: number }>({
                    action: 'import-confirm',
                    id: preview.id,
                    confirmed: true,
                  });
                  setNotice(
                    `${result.created} new payments imported. Duplicates skipped. Review each match below.`,
                  );
                  setPreview(null);
                  await refresh();
                })
              }
            >
              {preview.state === 'confirmed' ? 'This file was already imported' : 'Confirm import'}
            </button>
          </div>
        )}
      </section>
      <section className="card">
        <h3>Imported payments</h3>
        {data.imports.map((p) => {
          const allocated = data.matches
            .filter((m) => m.paymentId === p.id)
            .reduce((n, m) => n + BigInt(m.amount), 0n);
          return (
            <button
              className="draft-row"
              key={p.id}
              onClick={() => {
                setSelected(p.id);
                setActivityId('');
                matchKey.current = crypto.randomUUID();
              }}
            >
              <span>
                <strong>{p.counterparty || p.reference}</strong>
                <small>
                  {p.reference} · {p.eventDate} · {p.direction} ·{' '}
                  {currency(BigInt(p.amount) - allocated)} unmatched
                </small>
              </span>
              <strong>{currency(p.amount)}</strong>
            </button>
          );
        })}
        {!data.imports.length && (
          <Empty title="No imported payments yet">
            Your first preview starts above. Equal payment amounts alone are never treated as
            duplicates.
          </Empty>
        )}
      </section>
      {payment && (
        <section className="card match-card">
          <span className="badge mint">REVIEW A MATCH</span>
          <h3>
            {payment.reference} · {currency(payment.amount)}
          </h3>
          <p>{currency(BigInt(payment.amount) - used)} available to match.</p>
          <form
            key={selected + ':' + data.matches.length}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void t.run(async () => {
                matchKey.current ||= crypto.randomUUID();
                await api({
                  action: 'match',
                  paymentId: selected,
                  activityId,
                  settlementId:
                    method === 'corroborate' ? String(f.get('settlementId')) : undefined,
                  amount: String(f.get('amount')),
                  method,
                  acknowledgeConflict: f.get('conflict') === 'on',
                  requestKey: matchKey.current,
                  confirmed: true,
                });
                matchKey.current = '';
                setSelected('');
                setNotice('Payment matched. Existing receipts were not counted again.');
                await refresh();
              });
            }}
          >
            <label>
              Original sale, expense or purchase
              <select
                value={activityId}
                required
                onChange={(e) => {
                  setActivityId(e.target.value);
                  matchKey.current = crypto.randomUUID();
                }}
              >
                <option value="">Choose an activity</option>
                {data.activities
                  .filter(
                    (a) => !a.voidedAt && (a.type === 'SALE') === (payment.direction === 'IN'),
                  )
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.counterparty ?? 'No alias'} · {a.item} · {currency(a.amount)} ·{' '}
                      {a.eventDate}
                    </option>
                  ))}
              </select>
            </label>
            {activity && (
              <div className="notice">
                <strong>Match reasons to review</strong>
                <p className="small">
                  Amount:{' '}
                  {activity.amount === payment.amount
                    ? 'same as original activity'
                    : 'different from original; may be partial'}
                  . Date:{' '}
                  {activity.eventDate === payment.eventDate ? 'same day' : 'different dates'}.
                  Counterparty:{' '}
                  {activity.counterparty?.toLowerCase() === payment.counterparty.toLowerCase()
                    ? 'same alias'
                    : 'missing or different — review carefully'}
                  . Reference: {payment.reference} (no reference on the merchant activity; this
                  cannot independently confirm a match).
                </p>
              </div>
            )}
            <label>
              How does this payment relate?
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  matchKey.current = crypto.randomUUID();
                }}
              >
                <option value="corroborate">Support an already recorded receipt / payment</option>
                <option value="settle">Record a new payment against an outstanding debt</option>
              </select>
            </label>
            {method === 'corroborate' && (
              <label>
                Existing receipt / payment
                <select name="settlementId" required>
                  <option value="">Choose the recorded payment</option>
                  {settlements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.eventDate} · {currency(p.amount)} · {p.source}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Amount to allocate (₦)
              <input
                name="amount"
                inputMode="decimal"
                defaultValue={naira(BigInt(payment.amount) - used)}
                required
              />
            </label>
            <label className="consent">
              <input type="checkbox" name="conflict" />
              <span>
                I reviewed differing dates or aliases. For a new payment, I checked that this is
                distinct from any existing receipt.
              </span>
            </label>
            <label className="consent">
              <input type="checkbox" required />
              <span>I confirm this link and allocation amount.</span>
            </label>
            <Feedback error={t.error} />
            <button className="primary" disabled={t.busy || BigInt(payment.amount) === used}>
              <Link2 size={17} />
              Confirm payment match
            </button>
          </form>
        </section>
      )}
    </>
  );
}
