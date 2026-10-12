# MarketPulse Voice

A mobile-first merchant book: record → clarify → read back → explicitly confirm → persistent ledger → private business report. One Next.js/TypeScript application, PostgreSQL, Prisma, Zod and Better Auth.

The app includes a server-side adapter for the documented N-ATLAS gateway: audio transcription followed by structured transaction suggestions. Manual bookkeeping works without it. The workspace has not verified a live N-ATLAS request; configure an authorized gateway and key before relying on speech processing. Scripted transcripts are deliberately selected only in demo businesses when fixtures are enabled. This is not yet a completed voice-first competition submission.

## Run in this workspace (Windows PowerShell)

Node **24.19.0**, npm **11.17.0**, PostgreSQL **17.10**. Use `npm.cmd`; the machine's PowerShell policy blocks `npm.ps1`. No Docker is needed.

The local cluster is `.local/postgres`, bound to `127.0.0.1:5434`. Its databases are `marketpulse_dev`, `marketpulse_test` and `marketpulse_demo`. The pre-existing PostgreSQL service on port 5432 was not changed. `.env` contains locally generated secrets; do not commit or print it.

At handoff a built copy is running at **http://localhost:3000**; use it directly. Its process ID and logs are in ignored `.local/app.pid`, `.local/app.log` and `.local/app-error.log`. After that process stops, `npm.cmd start` runs the existing build in your terminal. Use the setup/development commands below when installing or changing the application; do not start a second app on the same port.

```powershell
# Only if the local database is stopped:
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 start

npm.cmd ci
npm.cmd run check:env
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run dev
```

Open **http://localhost:3000**. Create your own account (12-character minimum password) and business. Select **real business** for manual entries or **isolated demo** for synthetic workflow exploration. A demo business never contributes to real trader evaluation. This prepared workspace may set `TRANSCRIPTION_MODE=fixture` so demo businesses can try labelled examples. Fresh setup and `.env.example` default to `disabled`; change that setting and restart to enable the examples. Real businesses cannot use fixture transcription.

## N-ATLAS setup

In the local `.env` file, set `NATLAS_BASE_URL` to an authorized N-ATLAS gateway URL and `NATLAS_API_KEY` to a gateway Bearer key. Optionally set `NATLAS_MODEL` (default `NCAIR1/N-ATLaS`) and `NATLAS_TIMEOUT_MS` (default `60000`). Never put these values in browser code, commit them, or use the Hugging Face model-download token as the gateway key. `.env.example` contains placeholders only. A configured URL/key pair is not proof that the service works; the app checks service availability when a recording is submitted. The documented gateway accepts `en`, `yo`, `ig`, and `ha`. See [provider details and verification limits](docs/PROVIDERS.md).

If registry lookups stall on this Windows network, use `$env:NODE_OPTIONS='--dns-result-order=ipv4first'` in that terminal. This does not disable certificate checks.

## New checkout

Install the pinned Node runtime and PostgreSQL. Supply three dedicated PostgreSQL database URLs using `.env.example`, or run `powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1` to create an isolated local cluster. The script refuses to overwrite an existing `.env` and never resets a database. Then run the commands above. `.env` is the single local configuration source for Next.js, Prisma and scripts; avoid competing `.env.local` files.

## Try the complete accounting journey

1. In a demo business with fixtures enabled, tick recording consent and select **Ambiguous rice sale**. This is a fixed transcript, not speech recognition. Supply whether ₦40,000 is total or per bag, date, payment state and customer alias. Update the draft, read it, tick confirmation and save.
2. Record a ₦40,000 total **unpaid sale** to Amina. Summary shows ₦40,000 sales, ₦0 receipts and ₦40,000 customer debt.
3. Open Debts, record a **₦15,000 collection**, review and confirm. Sales remain ₦40,000, receipts become ₦15,000, debt becomes ₦25,000.
4. Under Ledger → Import & reconcile upload a CSV with a distinct transfer reference for ₦15,000. Preview and confirm the import, then **support an already recorded receipt**. Totals do not change.
5. Collect a distinct ₦25,000; debt reaches zero. Attach private invoice/receipt evidence if desired. Share a period snapshot from Summary; revoke it after reviewing.

For free text, the narrow parser recognises explicit totals such as `Sold rice for 40000 total on credit to Amina today.` It does not guess from “sold” whether money changed hands. The structured manual form supports all activity types. Speech output and voice confirmation are pending; read-back is text.

## Commands

| Command                                        | Purpose / database                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run dev`                              | Local app using `DATABASE_URL`; port 3000                                                                                          |
| `npm.cmd run build`                            | Generate Prisma client and build production bundle                                                                                 |
| `npm.cmd start`                                | Run built app locally using `DATABASE_URL`                                                                                         |
| `npm.cmd run lint` / `typecheck`               | Static checks, no financial writes                                                                                                 |
| `npm.cmd test`                                 | Deploy migrations to **TEST_DATABASE_URL**, then unit + PostgreSQL tests; refuses a non-test database                              |
| `npx.cmd playwright install chromium`          | Needed only without installed Windows Chrome; browser tests automatically use that Chrome when present                             |
| `npm.cmd run test:e2e`                         | Dedicated test server on 3100, test DB, synthetic accounts; `.next-e2e` build directory                                            |
| `npm.cmd run test:production`                  | After build and demo seed: built app on 3101, confirms exact totals and session persistence across a process restart; demo DB only |
| `npm.cmd run format`                           | Format source, scripts, tests and handoff documents                                                                                |
| `npm.cmd run db:generate`                      | Generate Prisma client, no schema mutation                                                                                         |
| `npm.cmd run db:migrate -- --name description` | Developer migration creation on `DATABASE_URL`; use only a development database                                                    |
| `npm.cmd run db:deploy`                        | Apply committed migrations on `DATABASE_URL`                                                                                       |
| `npm.cmd run db:seed:demo`                     | Idempotent seed, **only DEMO_DATABASE_URL** ending in `/marketpulse_demo`; refuses production                                      |
| `npm.cmd run check:env`                        | Report names/status only; never secrets                                                                                            |

Demo credentials are generated into ignored `.local/demo-login.txt`. To view seeded examples, start the app with `DATABASE_URL` set to the demo URL and `TRANSCRIPTION_MODE=fixture`; use a separate terminal and restore your environment afterward. Tests create only synthetic businesses in the test database. Production must use a fourth, separate database and `TRANSCRIPTION_MODE=disabled`.

## Recovery and limitations

- Recover drafts from Record after refresh. Current edits must be saved using **Update draft & read back**. Unsaved form edits and unsent recordings are held only in browser memory; they do not survive closing the page. No localStorage stores business information. There is no offline support.
- A failed live-provider request retains the browser's recording for retry. There is no hidden fallback. Already-confirmed retries return the same record.
- A confirmation applies to one version. Edits invalidate confirmation. Corrections make a linked replacement and keep the original. Corrections involving later payments or imported matches require review and are blocked. Refunds/payment reversals are explicitly unsupported.
- Evidence is private PostgreSQL `bytea`, limited to PDF/PNG/JPEG, 5 MB each and 100 files per business. Invoices support records but do not automatically create activity; OCR is deferred.
- Auth uses persistent sessions and a maintained password implementation. Email delivery, verification and password recovery are not configured. This prototype uses one owner/one business per account; team invitations are deferred.
- Any holder of a private share link can view that snapshot until expiry/revocation. It excludes aliases, transcripts and evidence files. A downloaded/printed copy cannot be revoked.
- Deletion controls remove transcripts, files, evaluation sessions and report snapshots. Financial history, account data and draft versions remain; see [privacy notes](docs/PRIVACY.md).
- Back up `.local/postgres` using PostgreSQL tooling, not live file copying. Do not run migration reset or delete `.local` to repair an app error.

See [architecture](docs/ARCHITECTURE.md), [deployment handoff](docs/DEPLOYMENT.md), [provider research](docs/PROVIDERS.md), [competition research](docs/COMPETITIONS.md), [submission drafts](docs/SUBMISSIONS.md), [field testing](docs/FIELD_TESTING.md) and [verification evidence](docs/VERIFICATION.md).
