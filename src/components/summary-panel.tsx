'use client';
import { useState } from 'react';
import { ChartNoAxesCombined, Download, Share2, ShieldCheck } from 'lucide-react';
import { lagosDate } from '@/lib/domain';
import { api, Feedback, useTask, Workspace } from './client-shared';
import { ReportView } from './report-view';
export function SummaryPanel({
  data,
  period,
  setPeriod,
  refresh,
}: {
  data: Workspace;
  period: { from: string; to: string };
  setPeriod: (p: { from: string; to: string }) => void;
  refresh: () => Promise<void>;
}) {
  const t = useTask();
  const [link, setLink] = useState('');
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SEE HOW BUSINESS IS MOVING</div>
          <h1>A clearer picture.</h1>
          <p>Understand your cash, your debts and what supports your records.</p>
        </div>
        <span className="page-symbol">
          <ChartNoAxesCombined />
        </span>
      </div>
      <form
        className="period-filter no-print"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setPeriod({ from: String(f.get('from')), to: String(f.get('to')) });
        }}
      >
        <label>
          From
          <input type="date" name="from" defaultValue={period.from} max={lagosDate()} required />
        </label>
        <label>
          Through
          <input type="date" name="to" defaultValue={period.to} max={lagosDate()} required />
        </label>
        <button className="secondary">Apply period</button>
        <button type="button" className="text-button" onClick={() => window.print()}>
          Print report
        </button>
      </form>
      <ReportView report={data.summary} />
      <section className="card no-print">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SHARE ON YOUR TERMS</span>
            <h3>A private view for a lender</h3>
          </div>
          <ShieldCheck size={28} />
        </div>
        <p className="muted">
          Share a fixed snapshot for this period. The link shows amounts, evidence labels and
          limitations. Customer aliases, transcripts and files stay private.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void t.run(async () => {
              const share = await api<{ token: string }>({
                action: 'share',
                from: period.from,
                to: period.to,
                hours: Number(f.get('hours')),
                confirmed: true,
              });
              setLink(`${window.location.origin}/share/${share.token}`);
              await refresh();
            });
          }}
        >
          <label>
            Link expires after
            <select name="hours">
              <option value="24">24 hours</option>
              <option value="72">3 days</option>
              <option value="168">7 days</option>
            </select>
          </label>
          <label className="consent">
            <input type="checkbox" required />
            <span>
              I choose to share this business and reporting period with anyone I give this private
              link to.
            </span>
          </label>
          <button className="primary" disabled={t.busy}>
            <Share2 size={18} />
            Create private report link
          </button>
        </form>
        <Feedback error={t.error} />
        {link && (
          <div className="notice success" role="status">
            <label>
              Copy this private link
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
            </label>
            <a href={link} target="_blank" rel="noreferrer">
              Open lender report
            </a>
            <p className="small">
              Treat this link as a password. It is shown only now; create a new link if you lose it.
            </p>
          </div>
        )}
        <div className="share-list">
          {data.shares.map((s) => (
            <div className="data-row" key={s.id}>
              <span>
                {s.revokedAt
                  ? 'Revoked'
                  : new Date(s.expiresAt) < new Date()
                    ? 'Expired'
                    : 'Active'}{' '}
                · expires {new Date(s.expiresAt).toLocaleString('en-NG')}
              </span>
              {!s.revokedAt && (
                <button
                  className="text-button danger"
                  onClick={() =>
                    void t.run(async () => {
                      await api({ action: 'revoke', id: s.id });
                      setLink('');
                      await refresh();
                    })
                  }
                >
                  Revoke link
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
export function SettingsPanel({
  data,
  refresh,
  signOut,
}: {
  data: Workspace;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const t = useTask();
  const [notice, setNotice] = useState('');
  const [deleteChecked, setDeleteChecked] = useState(false);
  const n = data.validations.length;
  const completed = data.validations.filter((v) => v.outcome === 'completed').length;
  const comparable = data.validations.filter(
    (v) => v.expectedAmount !== null && v.confirmedAmount !== null,
  );
  const exact = comparable.filter((v) => v.expectedAmount === v.confirmedAmount).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE</div>
          <h1>Help, privacy & testing.</h1>
          <p>Know what is connected and stay in control of your information.</p>
        </div>
      </div>
      <section className="card">
        <h3>Integration status</h3>
        <div className="data-row">
          <span>N-ATLAS speech recognition</span>
          <span className="badge amber">Blocked · no live access</span>
        </div>
        <div className="data-row">
          <span>Interpretation</span>
          <span>Limited local English rules + manual review</span>
        </div>
        <div className="data-row">
          <span>Scripted transcripts</span>
          <span>
            {data.capabilities.fixture ? 'Enabled for this demo' : 'Unavailable in this business'}
          </span>
        </div>
        <div className="data-row">
          <span>Speech output / voice controls</span>
          <span>Not connected · text and buttons available</span>
        </div>
        <div className="data-row">
          <span>Other languages / WhatsApp / invoice OCR</span>
          <span>Deferred</span>
        </div>
        <p className="muted small">
          Nigerian English is documented by the model publisher but has not been smoke-tested here.
          Pidgin is not claimed. There is no offline mode. Internet or a connection to the local
          server is required.
        </p>
      </section>
      <section className="card">
        <h3>Private by default</h3>
        <p>
          Audio is held in your browser until you send it, then discarded by the server after
          processing. Transcripts and draft history stay in your authenticated business. Evidence
          files are stored privately in PostgreSQL and are only downloaded after an ownership check.
        </p>
        <p>
          Delete private supporting material below to remove transcripts, evidence files, evaluation
          sessions and report snapshots. Confirmed records, draft versions, account details,
          counterparty aliases and audit history remain, so the financial history stays
          understandable. This is not full account erasure.
        </p>
        <label className="consent">
          <input
            type="checkbox"
            checked={deleteChecked}
            onChange={(e) => setDeleteChecked(e.target.checked)}
          />
          <span>I want to delete these private materials and revoke all shared reports.</span>
        </label>
        <button
          className="secondary danger"
          disabled={!deleteChecked || t.busy}
          onClick={() =>
            void t.run(async () => {
              await api({ action: 'delete-private-data', confirmed: true });
              setDeleteChecked(false);
              setNotice(
                'Private supporting material deleted. Financial and audit history retained.',
              );
              await refresh();
            })
          }
        >
          Delete private supporting material
        </button>
        <Feedback error={t.error} />
        {notice && (
          <div className="notice success" role="status">
            {notice}
          </div>
        )}
        <p className="muted small">
          Prototype retention: supporting material remains until you delete it. No background
          retention scheduler. Account email verification and password recovery email are not
          configured; use an email you control and keep your password safe.
        </p>
      </section>
      <section className="card">
        <div className="section-heading">
          <h3>Consented trader evaluation</h3>
          <a className="button secondary" href="/api/validation/export">
            <Download size={17} />
            Export CSV
          </a>
        </div>
        <p className="muted">
          Only log sessions actually facilitated with a consenting trader. Automated, developer and
          demo tests do not count.
        </p>
        <div className="chips">
          <span className="badge neutral">{n} real sessions recorded</span>
          <span className="badge neutral">
            Unassisted completion: {completed}/{n}
          </span>
          <span className="badge neutral">
            Exact amount: {exact}/{comparable.length} comparable
          </span>
        </div>
        {n > 0 && (
          <p className="small muted">
            Mean completion time:{' '}
            {Math.round(data.validations.reduce((s, v) => s + v.durationSeconds, 0) / n)} seconds
            across {n} sessions. Observational results, not a representative population estimate.
          </p>
        )}
        {data.business?.mode === 'demo' ? (
          <div className="notice warning">
            Evaluation recording is disabled in demo businesses. No demo interaction is counted as
            real validation.
          </div>
        ) : (
          <ValidationForm onDone={refresh} />
        )}
      </section>
      <button className="secondary mobile-signout" onClick={signOut}>
        Sign out
      </button>
    </>
  );
}
function ValidationForm({ onDone }: { onDone: () => Promise<void> }) {
  const t = useTask();
  const [notice, setNotice] = useState('');
  return (
    <details className="evaluation-form">
      <summary>Record a completed real session</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          void t.run(async () => {
            await api({
              action: 'validation',
              consent: true,
              participantId: String(f.get('participantId')),
              language: String(f.get('language')),
              task: String(f.get('task')),
              expectedAmount: String(f.get('expectedAmount')) || null,
              confirmedAmount: String(f.get('confirmedAmount')) || null,
              result: String(f.get('result')),
              correction: String(f.get('correction')),
              durationSeconds: Number(f.get('durationSeconds')),
              outcome: String(f.get('outcome')),
              feedback: String(f.get('feedback')),
            });
            setNotice('Consented session recorded.');
            form.reset();
            await onDone();
          });
        }}
      >
        <div className="form-grid">
          <label>
            Anonymous participant ID
            <input name="participantId" placeholder="P-A7K2" pattern="P-[A-Z0-9]{4,12}" required />
          </label>
          <label>
            Language used
            <select name="language">
              <option value="en-NG">Nigerian English</option>
              <option value="yo">Yoruba (capability unverified)</option>
              <option value="ha">Hausa (capability unverified)</option>
              <option value="ig">Igbo (capability unverified)</option>
            </select>
          </label>
          <label>
            Task
            <input
              name="task"
              maxLength={100}
              minLength={3}
              required
              placeholder="Credit sale, then partial collection"
            />
          </label>
          <label>
            Elapsed time (seconds)
            <input name="durationSeconds" type="number" min={1} max={7200} required />
          </label>
          <label>
            Expected total (₦)
            <input name="expectedAmount" inputMode="decimal" />
          </label>
          <label>
            Confirmed total (₦)
            <input name="confirmedAmount" inputMode="decimal" />
          </label>
          <label>
            System result
            <input name="result" maxLength={300} required />
          </label>
          <label>
            Correction made
            <input name="correction" maxLength={300} />
          </label>
          <label>
            Outcome
            <select name="outcome">
              <option value="completed">Completed without help</option>
              <option value="assisted">Completed with help</option>
              <option value="failed">Did not complete</option>
            </select>
          </label>
          <label>
            Brief feedback
            <input name="feedback" maxLength={500} />
          </label>
        </div>
        <label className="consent">
          <input type="checkbox" required />
          <span>
            The participant consented to anonymous evaluation, understands how to withdraw, and this
            was a real trader session. Do not enter names, phone numbers or account details.
          </span>
        </label>
        <Feedback error={t.error} />
        <button className="primary" disabled={t.busy}>
          Save consented session
        </button>
        {notice && <p role="status">{notice}</p>}
      </form>
    </details>
  );
}
