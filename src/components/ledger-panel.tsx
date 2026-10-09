'use client';
import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BookOpen, FileUp, Paperclip, Wallet } from 'lucide-react';
import { currency, emptyCandidate, lagosDate, naira } from '@/lib/domain';
import { api, DraftView, Empty, Feedback, typeLabels, useTask, Workspace } from './client-shared';
import { ImportPanel } from './import-panel';
export function LedgerPanel({
  data,
  refresh,
  onDraft,
}: {
  data: Workspace;
  refresh: () => Promise<void>;
  onDraft: (d: DraftView) => void;
}) {
  const [view, setView] = useState('activity');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const t = useTask();
  const activities = data.activities.filter((a) =>
    (a.item + ' ' + a.counterparty + ' ' + a.eventDate)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE STORY BEHIND THE NUMBERS</div>
          <h1>Your business ledger.</h1>
          <p>Every confirmed record, with a trail you can follow.</p>
        </div>
        <span className="page-symbol">
          <BookOpen />
        </span>
      </div>
      <div className="tabs" role="tablist" aria-label="Ledger view">
        {[
          ['activity', 'Activity'],
          ['payments', 'Cash payments'],
          ['imports', 'Import & reconcile'],
          ['history', 'Audit history'],
        ].map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            className={view === v ? 'active' : ''}
            onClick={() => setView(v)}
          >
            {l}
          </button>
        ))}
      </div>
      <Feedback error={t.error} />
      {view === 'imports' ? (
        <ImportPanel data={data} refresh={refresh} />
      ) : view === 'history' ? (
        <section className="card">
          <h3>A history that stays intact</h3>
          <p className="muted small">
            Actions include actor IDs and timestamps in the database. Confirmed history cannot be
            overwritten.
          </p>
          {data.audit.map((a) => (
            <div className="audit-row" key={a.id}>
              <span className="audit-dot" />
              <div>
                <strong>{a.action.replaceAll('.', ' · ')}</strong>
                <small>
                  {new Date(a.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} WAT
                </small>
                {typeof a.details.reason === 'string' && <p>{a.details.reason}</p>}
              </div>
            </div>
          ))}
          {!data.audit.length && (
            <Empty title="Your history starts here">
              Confirmed actions and corrections will appear here.
            </Empty>
          )}
        </section>
      ) : view === 'payments' ? (
        <section className="card">
          <h3>Actual recorded cash movement</h3>
          <p className="muted small">
            Payments are separate from sales. Imported payments enter these totals only after you
            allocate them.
          </p>
          {data.settlements.map((p) => (
            <div className={'ledger-row ' + (p.voidedAt ? 'voided' : '')} key={p.id}>
              <span className={'transaction-icon ' + (p.direction === 'OUT' ? 'out' : '')}>
                {p.direction === 'IN' ? <ArrowDownLeft /> : <ArrowUpRight />}
              </span>
              <div className="transaction-info">
                <strong>{p.counterparty || 'Cash payment'}</strong>
                <small>
                  {p.eventDate} · {p.source}
                  {p.voidedAt ? ' · replaced' : ''}
                </small>
              </div>
              <strong className="amount">
                {p.direction === 'OUT' ? '−' : '+'}
                {currency(p.amount)}
              </strong>
            </div>
          ))}
          {!data.settlements.length && (
            <Empty title="No payments recorded yet">
              A credit sale will appear as activity. Its payment appears here when collected.
            </Empty>
          )}
        </section>
      ) : (
        <section className="card ledger-card">
          <div className="section-heading">
            <h3>
              Confirmed activity <span className="count">{data.activities.length}</span>
            </h3>
            <label className="search-label">
              <span className="sr-only">Search ledger</span>
              <input
                type="search"
                placeholder="Find an item or customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {activities.map((a) => {
            const matched = data.matches.some((m) => m.activityId === a.id);
            const files = data.evidence.filter((e) => e.activityId === a.id);
            const label = matched
              ? 'payment-matched'
              : files.length
                ? 'document-supported'
                : 'self-reported';
            return (
              <div className={'entry ' + (a.voidedAt ? 'voided' : '')} key={a.id}>
                <button
                  className="ledger-row entry-button"
                  aria-expanded={open === a.id}
                  onClick={() => {
                    setOpen(open === a.id ? null : a.id);
                    setReason('');
                  }}
                >
                  <span className={'transaction-icon ' + (a.type !== 'SALE' ? 'out' : '')}>
                    {a.type === 'SALE' ? <ArrowDownLeft /> : <ArrowUpRight />}
                  </span>
                  <span className="transaction-info">
                    <strong>{a.item}</strong>
                    <small>
                      {typeLabels[a.type]} · {a.counterparty || 'No alias'} · {a.eventDate}
                    </small>
                    <span className={'badge ' + (matched ? 'mint' : 'neutral')}>
                      {a.voidedAt ? 'Replaced · retained in history' : label}
                    </span>
                  </span>
                  <span className="amount">{currency(a.amount)}</span>
                </button>
                {open === a.id && (
                  <div className="entry-detail">
                    <p className="small muted">
                      Source: {a.source}. Original saved{' '}
                      {new Date(a.createdAt).toLocaleString('en-NG')}.
                      {a.replacesId ? ' This entry replaces an earlier record.' : ''}
                    </p>
                    <div className="button-row">
                      {files.map((f) => (
                        <div key={f.id}>
                          <a className="button secondary" href={`/api/evidence?id=${f.id}`}>
                            <Paperclip size={16} />
                            Private evidence
                          </a>
                          <button
                            className="text-button danger"
                            onClick={() =>
                              void t.run(async () => {
                                await api({ action: 'delete-evidence', id: f.id });
                                await refresh();
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    {!a.voidedAt && (
                      <>
                        <label className="button secondary">
                          <FileUp size={17} />
                          Attach receipt / invoice
                          <input
                            className="sr-only"
                            type="file"
                            accept="application/pdf,image/png,image/jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                void t.run(async () => {
                                  const f = new FormData();
                                  f.set('activityId', a.id);
                                  f.set('file', file);
                                  const res = await fetch('/api/evidence', {
                                    method: 'POST',
                                    body: f,
                                  });
                                  const result = await res.json();
                                  if (!res.ok) throw new Error(result.error);
                                  await refresh();
                                });
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <p className="small muted">
                          PDF, PNG or JPEG · up to 5 MB · supporting evidence, not bank
                          verification. No OCR is performed.
                        </p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void t.run(async () => {
                              onDraft(
                                await api<DraftView>({
                                  action: 'correct',
                                  id: a.id,
                                  reason,
                                  requestKey: crypto.randomUUID(),
                                }),
                              );
                              await refresh();
                            });
                          }}
                        >
                          <label>
                            Reason for correction
                            <input
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              minLength={5}
                              maxLength={300}
                              required
                              placeholder="e.g. The total should have been ₦45,000"
                            />
                          </label>
                          <button className="secondary" disabled={t.busy}>
                            Correct entry
                          </button>
                        </form>
                        <p className="small muted">
                          You’ll review and confirm a replacement. Later payments or matches block
                          correction until reviewed. Refunds and payment reversals are not
                          supported.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!activities.length && (
            <Empty title="A fresh page for your business">
              Confirm your first record in Record. Unconfirmed drafts do not appear here.
            </Empty>
          )}
          <p className="small muted ledger-footnote">
            All confirmed activities, including retained corrections. Unconfirmed drafts are
            excluded.
          </p>
        </section>
      )}
    </>
  );
}
export function DebtsPanel({
  data,
  onDraft,
  refresh,
}: {
  data: Workspace;
  onDraft: (d: DraftView) => void;
  refresh: () => Promise<void>;
}) {
  const [direction, setDirection] = useState('customer');
  const t = useTask();
  const debts = data.activities
    .filter((a) => !a.voidedAt)
    .map((a) => ({
      ...a,
      remaining:
        BigInt(a.amount) -
        data.allocations
          .filter((x) => x.activityId === a.id)
          .reduce((n, x) => n + BigInt(x.amount), 0n),
    }))
    .filter((a) => a.remaining > 0n);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KEEP GOOD RELATIONSHIPS</div>
          <h1>Know what’s outstanding.</h1>
          <p>Follow the original sale or purchase through to its final payment.</p>
        </div>
        <span className="page-symbol">
          <Wallet />
        </span>
      </div>
      <div className="two-cols">
        <div className="stat accent">
          <span>Customers owe you</span>
          <strong>
            {currency(debts.filter((a) => a.type === 'SALE').reduce((n, a) => n + a.remaining, 0n))}
          </strong>
          <small>Remaining on recorded sales</small>
        </div>
        <div className="stat">
          <span>You owe suppliers</span>
          <strong>
            {currency(debts.filter((a) => a.type !== 'SALE').reduce((n, a) => n + a.remaining, 0n))}
          </strong>
          <small>Remaining on purchases and expenses</small>
        </div>
      </div>
      <div className="tabs">
        <button
          className={direction === 'customer' ? 'active' : ''}
          onClick={() => setDirection('customer')}
        >
          Customer debts
        </button>
        <button
          className={direction === 'supplier' ? 'active' : ''}
          onClick={() => setDirection('supplier')}
        >
          Supplier debts
        </button>
      </div>
      <Feedback error={t.error} />
      <section className="card">
        {debts
          .filter((a) => (a.type === 'SALE') === (direction === 'customer'))
          .map((a) => (
            <div className="debt-row" key={a.id}>
              <span className="avatar">{(a.counterparty ?? '?').slice(0, 1)}</span>
              <div className="transaction-info">
                <strong>{a.counterparty || 'Unspecified counterparty'}</strong>
                <small>
                  {a.item} · {a.eventDate} · original {currency(a.amount)}
                </small>
              </div>
              <div className="debt-action">
                <strong>{currency(a.remaining)}</strong>
                <button
                  className="secondary"
                  disabled={t.busy}
                  onClick={() =>
                    void t.run(async () => {
                      const c = {
                        ...emptyCandidate(),
                        type:
                          a.type === 'SALE'
                            ? ('COLLECTION' as const)
                            : ('SUPPLIER_PAYMENT' as const),
                        item: `Payment for ${a.item}`,
                        counterparty: a.counterparty,
                        total: naira(a.remaining),
                        paymentState: 'paid' as const,
                        eventDate: lagosDate(),
                        debtActivityId: a.id,
                      };
                      onDraft(
                        await api<DraftView>({
                          action: 'draft',
                          candidate: c,
                          requestKey: crypto.randomUUID(),
                        }),
                      );
                      await refresh();
                    })
                  }
                >
                  {direction === 'customer' ? 'Record collection' : 'Record payment'}
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          ))}
        {!debts.some((a) => (a.type === 'SALE') === (direction === 'customer')) && (
          <Empty title="Nothing outstanding here">
            Confirmed credit records and partial payments will appear here. A payment reduces debt
            without creating another sale.
          </Empty>
        )}
      </section>
      <div className="notice">
        Collections can be partial. Review the amount before confirming; overpayments are rejected.
      </div>
    </>
  );
}
