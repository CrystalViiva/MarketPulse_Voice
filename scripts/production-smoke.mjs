import 'dotenv/config';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, open } from 'node:fs/promises';
const databaseUrl = process.env.DEMO_DATABASE_URL;
if (
  !databaseUrl ||
  !new URL(databaseUrl).pathname.endsWith('/marketpulse_demo') ||
  databaseUrl === process.env.DATABASE_URL
)
  throw new Error('Production smoke test requires the separate demo database.');
const credentials = await readFile('.local/demo-login.txt', 'utf8');
const email = credentials.match(/^Email: (.+)$/m)?.[1].trim();
const password = credentials.match(/^Password: (.+)$/m)?.[1].trim();
if (!email || !password) throw new Error('Run db:seed:demo first.');
const origin = 'http://localhost:3101';
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  BETTER_AUTH_URL: origin,
  APP_ENV: 'demo',
  TRANSCRIPTION_MODE: 'fixture',
  NODE_ENV: 'production',
};
const log = await open('.local/production-smoke.log', 'a');
let child;
async function start() {
  child = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3101'],
    { env, windowsHide: true, stdio: ['ignore', log.fd, log.fd] },
  );
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const r = await fetch(origin, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return;
    } catch {
      // The server may not have opened its port yet; keep the bounded retry.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Built app did not start; inspect .local/production-smoke.log.');
}
async function stop() {
  if (!child) return;
  if (process.platform === 'win32')
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
  else child.kill('SIGTERM');
  child = undefined;
  await new Promise((r) => setTimeout(r, 500));
}
async function signin() {
  const r = await fetch(origin + '/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Demo sign-in failed (${r.status}).`);
  return r.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
}
async function action(cookie, body) {
  const r = await fetch(origin + '/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Smoke action ${body.action} failed (${r.status}).`);
  return r.json();
}
try {
  await start();
  const cookie = await signin();
  const candidate = {
    type: 'SALE',
    item: 'Production restart smoke — synthetic',
    quantity: null,
    unit: null,
    unitPrice: null,
    total: '1.23',
    currency: 'NGN',
    eventDate: '2026-10-09',
    counterparty: null,
    paymentState: 'paid',
    amountPaid: null,
    outstandingAmount: null,
    debtActivityId: null,
    source: 'manual',
    unresolvedFields: [],
  };
  const draft = await action(cookie, {
    action: 'draft',
    candidate,
    requestKey: 'production-restart-smoke-v1',
  });
  const confirmed = await action(cookie, {
    action: 'confirm',
    id: draft.id,
    version: draft.version,
    confirmed: true,
  });
  const before = await (
    await fetch(origin + '/api/workspace?from=2026-10-09&to=2026-10-09', {
      headers: { Cookie: cookie },
    })
  ).json();
  if (!before.activities.some((a) => a.id === confirmed.id))
    throw new Error('Confirmed record was not visible before restart.');
  await stop();
  await start();
  const response = await fetch(origin + '/api/workspace?from=2026-10-09&to=2026-10-09', {
    headers: { Cookie: cookie },
  });
  if (!response.ok) throw new Error('Database session did not survive restart.');
  const after = await response.json();
  if (
    !after.activities.some((a) => a.id === confirmed.id) ||
    after.summary.sales !== before.summary.sales ||
    after.summary.receipts !== before.summary.receipts
  )
    throw new Error('Financial persistence changed across restart.');
  console.log(
    'PASS: built app sign-in, explicit confirmation, persistent session and exact ledger totals survive a full app-process restart. Isolated demo DB only.',
  );
} finally {
  await stop();
  await log.close();
}
