'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AudioLines,
  BookOpen,
  ChartNoAxesCombined,
  CircleHelp,
  LogOut,
  Mic,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { lagosDate } from '@/lib/domain';
import { api, DraftView, Feedback, useTask, Workspace } from './client-shared';
import { RecordPanel } from './record-panel';
import { LedgerPanel, DebtsPanel } from './ledger-panel';
import { SummaryPanel, SettingsPanel } from './summary-panel';
type Tab = 'record' | 'ledger' | 'debts' | 'summary' | 'settings';
const nav = [
  { id: 'record', label: 'Record', icon: Mic },
  { id: 'ledger', label: 'Ledger', icon: BookOpen },
  { id: 'debts', label: 'Debts', icon: Wallet },
  { id: 'summary', label: 'Summary', icon: ChartNoAxesCombined },
] as const;
export function MerchantApp() {
  const [data, setData] = useState<Workspace | null>(null);
  const [authNeeded, setAuthNeeded] = useState(false);
  const [tab, setTab] = useState<Tab>('record');
  const [draft, setDraft] = useState<DraftView | null>(null);
  const [period, setPeriod] = useState({ from: lagosDate(), to: lagosDate() });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspace?from=${period.from}&to=${period.to}`, {
        cache: 'no-store',
      });
      if (res.status === 401) {
        setAuthNeeded(true);
        setData(null);
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setData(body);
      setAuthNeeded(false);
      setLoadError('');
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : 'Cannot connect. Check your connection and retry.',
      );
    } finally {
      setLoading(false);
    }
  }, [period]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const openDraft = (d: DraftView) => {
    setDraft(d);
    setTab('record');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  if (loading)
    return (
      <main className="loading-screen">
        <AudioLines size={42} />
        <p>Opening your business book…</p>
      </main>
    );
  if (authNeeded) return <AuthScreen onDone={refresh} />;
  if (!data)
    return (
      <main className="shared-report">
        <h1>Let’s reconnect</h1>
        <Feedback error={loadError} />
        <button onClick={refresh}>Retry</button>
      </main>
    );
  if (!data.business) return <Onboarding onDone={refresh} />;
  const greeting = new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Lagos',
  }).format(new Date());
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="MarketPulse Voice home">
          <span className="brand-mark">
            <AudioLines />
          </span>
          <span>
            MarketPulse<small>VOICE</small>
          </span>
        </Link>
        <div className="workspace-label">YOUR BUSINESS BOOK</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={'nav-item ' + (tab === n.id ? 'active' : '')}
              onClick={() => setTab(n.id)}
              aria-current={tab === n.id ? 'page' : undefined}
            >
              <n.icon size={21} />
              <span>{n.label}</span>
              {n.id === 'record' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={22} />
          <strong>Your records. Your choice.</strong>
          <p>Nothing enters your ledger until you confirm it.</p>
        </div>
        <button
          className={'nav-item ' + (tab === 'settings' ? 'active' : '')}
          onClick={() => setTab('settings')}
        >
          <CircleHelp size={20} />
          Help & privacy
        </button>
        <button
          className="nav-item"
          onClick={async () => {
            await authClient.signOut();
            setDraft(null);
            await refresh();
          }}
        >
          <LogOut size={20} />
          Sign out
        </button>
        <div className="business-chip">
          <span className="avatar">{data.business.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{data.business.name}</strong>
            <small>
              {data.business.mode === 'demo' ? 'Isolated demo business' : 'Merchant workspace'}
            </small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <AudioLines size={25} />
            <strong>MarketPulse</strong>
          </div>
          <span className="desktop-date">{greeting}</span>
          <div className="topbar-right">
            <span className="private-label">
              <span />
              Private workspace
            </span>
            <button
              className="avatar mobile-profile"
              onClick={() => setTab('settings')}
              aria-label="Help and privacy"
            >
              {data.business.name.slice(0, 1)}
            </button>
          </div>
        </header>
        <main id="main" className="main-content">
          <Feedback error={loadError} />
          {data.business.mode === 'demo' && (
            <div className="demo-ribbon">
              <span>DEMO BUSINESS</span> Sample records stay separate from real trader evidence.
            </div>
          )}
          {tab === 'record' && (
            <RecordPanel data={data} draft={draft} setDraft={setDraft} refresh={refresh} />
          )}
          {tab === 'ledger' && <LedgerPanel data={data} refresh={refresh} onDraft={openDraft} />}
          {tab === 'debts' && <DebtsPanel data={data} refresh={refresh} onDraft={openDraft} />}
          {tab === 'summary' && (
            <SummaryPanel data={data} period={period} setPeriod={setPeriod} refresh={refresh} />
          )}
          {tab === 'settings' && (
            <SettingsPanel
              data={data}
              refresh={refresh}
              signOut={async () => {
                await authClient.signOut();
                await refresh();
              }}
            />
          )}
        </main>
        <footer className="app-footer">
          Made for the way you do business.<span>NGN · Africa/Lagos</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map((n) => (
          <button
            key={n.id}
            className={tab === n.id ? 'active' : ''}
            onClick={() => setTab(n.id)}
            aria-current={tab === n.id ? 'page' : undefined}
          >
            <n.icon size={23} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
function AuthScreen({ onDone }: { onDone: () => Promise<void> }) {
  const [signup, setSignup] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmationValue, setConfirmationValue] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const t = useTask();
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand light">
          <span className="brand-mark">
            <AudioLines />
          </span>
          <span>
            MarketPulse<small>VOICE</small>
          </span>
        </div>
        <div>
          <div className="eyebrow">EVERY DAY COUNTS</div>
          <h1>
            Your business,
            <br />
            in your words.
          </h1>
          <p>A simpler way to keep track of sales, payments and the people who owe you.</p>
          <div className="story-lines">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <small>Built for Nigerian merchants · Your records stay private</small>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <span className="badge mint">YOUR BUSINESS BOOK</span>
          <h2>{signup ? 'Start with a clear record.' : 'Good to have you back.'}</h2>
          <p className="muted">
            {signup
              ? 'Create your private merchant account.'
              : 'Sign in to pick up where you left off.'}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (signup && f.get('password') !== f.get('confirmPassword')) {
                setPasswordMismatch(true);
                return;
              }
              setPasswordMismatch(false);
              void t.run(async () => {
                const input = {
                  email: String(f.get('email')),
                  password: String(f.get('password')),
                };
                const result = signup
                  ? await authClient.signUp.email({ ...input, name: String(f.get('name')) })
                  : await authClient.signIn.email(input);
                if (result.error) throw new Error(result.error.message ?? 'Unable to sign in.');
                await onDone();
              });
            }}
          >
            {signup && (
              <label>
                Your name
                <input name="name" autoComplete="name" required maxLength={80} />
              </label>
            )}
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <div className="auth-password-field">
              <label htmlFor="auth-password">Password</label>
              <span className="password-field">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  minLength={12}
                  maxLength={128}
                  required
                  placeholder={signup ? 'At least 12 characters' : ''}
                  value={passwordValue}
                  onChange={(event) => {
                    setPasswordValue(event.target.value);
                    if (event.target.value === confirmationValue) setPasswordMismatch(false);
                  }}
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </div>
            {signup && (
              <div className="auth-password-field">
                <label htmlFor="auth-confirm-password">Confirm password</label>
                <span className="password-field">
                  <input
                    id="auth-confirm-password"
                    name="confirmPassword"
                    type={showConfirmation ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={confirmationValue}
                    aria-invalid={passwordMismatch}
                    aria-describedby={passwordMismatch ? 'password-mismatch' : undefined}
                    onChange={(event) => {
                      setConfirmationValue(event.target.value);
                      if (event.target.value === passwordValue) setPasswordMismatch(false);
                    }}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={showConfirmation ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmation}
                    onClick={() => setShowConfirmation((visible) => !visible)}
                  >
                    {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
                {passwordMismatch && (
                  <span id="password-mismatch" className="field-error" role="alert">
                    The passwords do not match.
                  </span>
                )}
              </div>
            )}
            <Feedback error={t.error} />
            <button className="primary wide" disabled={t.busy}>
              {t.busy ? 'Please wait…' : signup ? 'Create my account' : 'Sign in'}
              <ArrowUpRight size={19} />
            </button>
          </form>
          <button
            className="text-button wide"
            type="button"
            onClick={() => {
              setSignup(!signup);
              setPasswordMismatch(false);
            }}
          >
            {signup ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
          <p className="small muted">
            Voice recording uses the N-ATLAS gateway when configured. Manual bookkeeping remains
            available, and demo examples are clearly labelled.
          </p>
        </div>
      </section>
    </main>
  );
}
function Onboarding({ onDone }: { onDone: () => Promise<void> }) {
  const t = useTask();
  return (
    <main className="onboarding card">
      <AudioLines size={36} />
      <h1>Give your business a home.</h1>
      <p className="muted">
        One private business per account. Choose a real book or an isolated demo.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void t.run(async () => {
            await api({
              action: 'onboard',
              name: String(f.get('name')),
              mode: String(f.get('mode')),
            });
            await onDone();
          });
        }}
      >
        <label>
          Business name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. Amina’s provisions"
          />
        </label>
        <fieldset>
          <legend>What will you use this book for?</legend>
          <label className="choice">
            <input type="radio" name="mode" value="real" defaultChecked />
            My real business records
          </label>
          <label className="choice">
            <input type="radio" name="mode" value="demo" />
            Try an isolated demo with synthetic examples
          </label>
        </fieldset>
        <Feedback error={t.error} />
        <button className="primary wide" disabled={t.busy}>
          Open my business book
          <ArrowUpRight size={18} />
        </button>
      </form>
    </main>
  );
}
