import { expect, test, APIRequestContext } from '@playwright/test';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith('/marketpulse_test'))
  throw new Error('Browser fixtures require isolated test DB.');
const testDb = new PrismaClient({ datasourceUrl: testUrl });
test.beforeEach(async () => {
  await testDb.authRateLimit.deleteMany();
});
test.afterAll(async () => {
  await testDb.$disconnect();
});
const unique = () => crypto.randomUUID();
async function register(request: APIRequestContext, name = 'Browser merchant') {
  const email = `test-${unique()}@example.test`;
  const password = `Test-only-${unique()}`;
  const res = await request.post('/api/auth/sign-up/email', {
    data: { name, email, password },
    headers: { Origin: 'http://localhost:3100' },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const business = await request.post('/api/actions', {
    data: { action: 'onboard', name: 'Amina’s provisions — BROWSER DEMO', mode: 'demo' },
    headers: { Origin: 'http://localhost:3100' },
  });
  expect(business.ok()).toBeTruthy();
  return { email, password };
}
test('registration checks confirmation locally and keeps visibility controls independent', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Your name').fill('Registration check');
  await page.getByLabel('Email address').fill(`signup-${unique()}@example.test`);
  const password = `Test-only-${unique()}`;
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(`${password}wrong`);
  let registrationRequests = 0;
  let registrationPayload: Record<string, unknown> | undefined;
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/sign-up/email')) {
      registrationRequests++;
      registrationPayload = request.postDataJSON() as Record<string, unknown>;
    }
  });
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.getByRole('alert')).toContainText('passwords do not match');
  expect(registrationRequests).toBe(0);

  const showButtons = page.getByRole('button', { name: 'Show password' });
  await showButtons.nth(0).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('Confirm password')).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Confirm password')).toHaveAttribute('type', 'text');
  await page.getByLabel('Confirm password').fill(password);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create my account' }).click();
  await expect(page.getByRole('heading', { name: 'Give your business a home.' })).toBeVisible();
  expect(registrationPayload).not.toHaveProperty('confirmPassword');
});
test('mobile clarification, read-back, persistent ledger, debts and private report', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page.request);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Let’s book your day.' })).toBeVisible();
  await page.getByLabel('I agree to process this recording').check();
  await page.getByRole('button', { name: 'Ambiguous rice sale' }).click();
  await expect(page.getByText('A few details to clarify')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm & save record' })).toBeDisabled();
  await page.getByLabel('Total amount (₦)', { exact: true }).fill('40000');
  await page.getByLabel('Date in Lagos').fill('2026-10-09');
  await page.getByLabel('Customer / supplier alias').fill('Amina');
  await page.getByLabel('Payment status').selectOption('unpaid');
  await page.getByRole('button', { name: 'Update draft & read back' }).click();
  await expect(page.getByText('PLEASE CHECK BEFORE SAVING')).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-readback.png', fullPage: true });
  await page.getByLabel('I have checked this version.').check();
  await page.getByRole('button', { name: 'Confirm & save record' }).click();
  await expect(page.getByText('Record confirmed and saved.')).toBeVisible();
  await page.reload();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('button', { name: 'Debts' })
    .click();
  await expect(page.getByText('Amina', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Record collection' }).click();
  await page.getByLabel('Total amount (₦)', { exact: true }).fill('15000');
  await page.getByRole('button', { name: 'Update draft & read back' }).click();
  await page.getByLabel('I have checked this version.').check();
  await page.getByRole('button', { name: 'Confirm & save record' }).click();
  await expect(page.getByText('Record confirmed and saved.')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('button', { name: 'Summary' })
    .click();
  await expect(page.getByText('₦25,000', { exact: true })).toBeVisible();
  await expect(page.getByText('₦15,000', { exact: true }).first()).toBeVisible();
  await page.getByLabel('I choose to share this business').check();
  await page.getByRole('button', { name: 'Create private report link' }).click();
  const link = await page.getByLabel('Copy this private link').inputValue();
  const lender = await page.context().newPage();
  await lender.goto(link);
  await expect(lender.getByText('PRIVATE BUSINESS REPORT · READ ONLY')).toBeVisible();
  await expect(
    lender.getByText('No credit score, loan approval or lender partnership is implied.'),
  ).toBeVisible();
  await lender.screenshot({ path: 'test-results/lender-report.png', fullPage: true });
  await page.getByRole('button', { name: 'Revoke link' }).click();
  await lender.reload();
  await expect(
    lender.getByRole('heading', { name: 'This report link is unavailable' }),
  ).toBeVisible();
});
test('real sign-in, denied microphone, recoverable provider failure and keyboard entry', async ({
  page,
}) => {
  const credentials = await register(page.request);
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Already have an account? Sign in' }).click();
  await page.getByLabel('Email address').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Let’s book your day.' })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => Promise.reject(new DOMException('denied', 'NotAllowedError')),
      configurable: true,
    });
  });
  await page.getByLabel('I agree to process this recording').check();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.locator('.notice.error')).toContainText('Microphone access was denied');
  await expect(page.getByText('Upload audio', { exact: true })).toBeVisible();
  // Real-mode request is never silently replaced by a fixture.
  const b = Buffer.alloc(44 + 32000);
  b.write('RIFF');
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24);
  b.writeUInt32LE(32000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(32000, 40);
  const res = await page.request.post('/api/voice', {
    headers: { Origin: 'http://localhost:3100' },
    multipart: {
      mode: 'live',
      consent: 'true',
      language: 'en',
      requestKey: unique(),
      audio: { name: 'test.wav', mimeType: 'audio/wav', buffer: b },
    },
  });
  expect(res.status()).toBe(503);
  expect((await res.json()).error).toContain('not configured');
  await page.getByRole('button', { name: 'Manual entry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review your business record' })).toBeVisible();
  await page.getByLabel('Kind of record').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Item or description')).toBeFocused();
});
test('merchant isolation, private files, report revocation and cross-origin protection', async ({
  browser,
}) => {
  const first = await browser.newContext({ baseURL: 'http://localhost:3100' });
  const second = await browser.newContext({ baseURL: 'http://localhost:3100' });
  await register(first.request);
  await register(second.request);
  const headers = { Origin: 'http://localhost:3100' };
  const candidate = {
    type: 'SALE',
    item: 'Private rice',
    quantity: null,
    unit: null,
    unitPrice: null,
    total: '100',
    currency: 'NGN',
    eventDate: '2026-10-09',
    counterparty: 'Private alias',
    paymentState: 'unpaid',
    amountPaid: null,
    outstandingAmount: null,
    debtActivityId: null,
    source: 'manual',
    unresolvedFields: [],
  };
  const draft = await (
    await first.request.post('/api/actions', {
      headers,
      data: { action: 'draft', candidate, requestKey: unique() },
    })
  ).json();
  const forbidden = await second.request.post('/api/actions', {
    headers,
    data: { action: 'confirm', id: draft.id, version: 1, confirmed: true },
  });
  expect(forbidden.status()).toBe(404);
  const record = await (
    await first.request.post('/api/actions', {
      headers,
      data: { action: 'confirm', id: draft.id, version: 1, confirmed: true },
    })
  ).json();
  const file = await (
    await first.request.post('/api/evidence', {
      headers,
      multipart: {
        activityId: record.id,
        file: {
          name: 'receipt.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\nsynthetic test only'),
        },
      },
    })
  ).json();
  expect((await first.request.get(`/api/evidence?id=${file.id}`)).status()).toBe(200);
  expect((await second.request.get(`/api/evidence?id=${file.id}`)).status()).toBe(404);
  const share = await (
    await first.request.post('/api/actions', {
      headers,
      data: { action: 'share', from: '2026-10-09', to: '2026-10-09', hours: 1, confirmed: true },
    })
  ).json();
  expect(
    (
      await second.request.post('/api/actions', {
        headers,
        data: { action: 'revoke', id: share.id },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await second.request.post('/api/actions', {
        headers: { Origin: 'https://untrusted.example' },
        data: { action: 'query', text: 'today sales' },
      })
    ).status(),
  ).toBe(403);
  const secondWorkspace = await (await second.request.get('/api/workspace')).json();
  expect(secondWorkspace.activities).toHaveLength(0);
  await first.close();
  await second.close();
});
test('desktop screen and denied network retry keep the same draft', async ({ page }) => {
  await register(page.request);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Let’s book your day.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/desktop-record.png', fullPage: true });
  await page.getByRole('button', { name: 'Manual entry', exact: true }).click();
  await page.getByLabel('Kind of record').selectOption('SALE');
  await page.getByLabel('Item or description').fill('Tomatoes');
  await page.getByLabel('Total amount (₦)', { exact: true }).fill('8500');
  await page.getByLabel('Payment status').selectOption('paid');
  await page.getByRole('button', { name: 'Update draft & read back' }).click();
  await page.getByLabel('I have checked this version.').check();
  await page.route('**/api/actions', (route) => route.abort(), { times: 1 });
  await page.getByRole('button', { name: 'Confirm & save record' }).click();
  await expect(page.locator('.notice.error')).toContainText('Connection lost');
  await page.getByRole('button', { name: 'Confirm & save record' }).click();
  await expect(page.getByText('Record confirmed and saved.')).toBeVisible();
  const workspace = await (await page.request.get('/api/workspace')).json();
  expect(workspace.activities).toHaveLength(1);
});
test('CSV preview and corroboration UI preserve cash totals', async ({ page }) => {
  await register(page.request);
  const headers = { Origin: 'http://localhost:3100' };
  const c = {
    type: 'SALE',
    item: 'Rice',
    quantity: null,
    unit: null,
    unitPrice: null,
    total: '40000',
    currency: 'NGN',
    eventDate: '2026-10-09',
    counterparty: 'Amina',
    paymentState: 'partial',
    amountPaid: '15000',
    outstandingAmount: null,
    debtActivityId: null,
    source: 'manual',
    unresolvedFields: [],
  };
  const draft = await (
    await page.request.post('/api/actions', {
      headers,
      data: { action: 'draft', candidate: c, requestKey: unique() },
    })
  ).json();
  await page.request.post('/api/actions', {
    headers,
    data: { action: 'confirm', id: draft.id, version: 1, confirmed: true },
  });
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Main navigation', exact: true })
    .getByRole('button', { name: 'Ledger' })
    .click();
  await page.getByRole('tab', { name: 'Import & reconcile' }).click();
  await page.locator('input[type=file][accept=".csv,text/csv"]').setInputFiles({
    name: 'payments.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'reference,date,direction,amount,counterparty\nUI-TRANSFER-15K,2026-10-09,IN,15000.00,Amina',
    ),
  });
  await expect(page.getByRole('heading', { name: 'Import preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm import', exact: true }).click();
  await page.getByRole('button', { name: /Amina.*UI-TRANSFER-15K/ }).click();
  await page.getByLabel('Original sale, expense or purchase').selectOption({ index: 1 });
  await page.getByLabel('Existing receipt / payment').selectOption({ index: 1 });
  await page.getByLabel('I confirm this link and allocation amount.').check();
  await page.getByRole('button', { name: 'Confirm payment match' }).click();
  await expect(
    page.getByText('Payment matched. Existing receipts were not counted again.'),
  ).toBeVisible();
  const workspace = await (
    await page.request.get('/api/workspace?from=2026-10-09&to=2026-10-09')
  ).json();
  expect(workspace.summary).toMatchObject({
    sales: '4000000',
    receipts: '1500000',
    customerDebt: '2500000',
  });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/reconciliation.png', fullPage: true });
});
test('browser records and normalizes audio, then keeps it after provider failure', async ({
  page,
  context,
}) => {
  await register(page.request);
  await context.grantPermissions(['microphone'], { origin: 'http://localhost:3100' });
  await page.goto('/');
  await page.getByLabel('I agree to process this recording').check();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByRole('heading', { name: /Listening/ })).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByRole('heading', { name: 'Your recording is ready' })).toBeVisible();
  await page.getByLabel('Speech language').selectOption('yo');
  await page.getByRole('button', { name: 'Send for transcription' }).click();
  await expect(page.locator('.notice.error')).toContainText('N-ATLAS is not configured');
  await expect(page.getByRole('heading', { name: 'Your recording is ready' })).toBeVisible();
  await expect(page.locator('audio')).toHaveAttribute('src', /^blob:/);
});
test('explicit fixture sale creates a draft while a fixture query only reads confirmed totals', async ({
  page,
}) => {
  await register(page.request);
  await page.goto('/');
  await page.getByLabel('I agree to process this recording').check();
  await page.getByRole('button', { name: '₦40,000 credit sale', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review your business record' })).toBeVisible();
  await expect(page.getByText('PLEASE CHECK BEFORE SAVING')).toBeVisible();
  let workspace = await (await page.request.get('/api/workspace')).json();
  expect(workspace.activities).toHaveLength(0);
  await page.getByLabel('I have checked this version.').check();
  await page.getByRole('button', { name: 'Confirm & save record' }).click();
  await expect(page.getByText('Record confirmed and saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Today’s sales query', exact: true }).click();
  await expect(page.locator('.query-answer')).toContainText('₦40,000');
  workspace = await (await page.request.get('/api/workspace')).json();
  expect(workspace.activities).toHaveLength(1);
  expect(workspace.summary.receipts).toBe('0');
  expect(workspace.summary.customerDebt).toBe('4000000');
});

test('authentication rate limit is enforced rather than disabled for tests', async ({
  request,
}) => {
  const credentials = await register(request);
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const response = await request.post('/api/auth/sign-in/email', {
      headers: { Origin: 'http://localhost:3100' },
      data: { email: credentials.email, password: 'Deliberately-wrong-password' },
    });
    statuses.push(response.status());
  }
  expect(statuses).toContain(401);
  expect(statuses).toContain(429);
});
