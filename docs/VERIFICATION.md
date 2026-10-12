# Verification record

Verified **9 October 2026**, Windows PowerShell, Node 24.19.0, npm 11.17.0, PostgreSQL 17.10. All automated business examples below are synthetic. They are not trader validation or live ASR accuracy measurements.

## Follow-up implementation check — 12 October 2026

- N-ATLAS adapter, auth confirmation and language-selection changes: direct unit tests **passed** (16 tests across `tests/domain.test.ts` and `tests/natlas.test.ts`); lint, standalone TypeScript check, Prettier check and `npm.cmd run check:env` **passed**.
- The environment check reported no N-ATLAS configuration. Mocked adapter tests are not live service evidence. No credentials were displayed.
- Database integration tests and Playwright were not run: test/demo database availability is unverified, and this session must not create missing databases or run migrations without approval.
- Production build and Prisma generation were not run because a running Node app may hold Prisma's Windows engine DLL; the running app was left undisturbed. Database-backed sign-in was not retested.
- No database, migration, role, password, or `.env` changes were made. No real-user sessions or language accuracy metrics were collected.

## Environment and reproducibility

- Dedicated PostgreSQL cluster `.local/postgres` accepts connections at `127.0.0.1:5434`. Separate dev, test and demo databases; existing port-5432 service untouched.
- `npm.cmd ci --prefer-offline --fetch-retries=1 --fetch-timeout=30000 --maxsockets=4 --no-audit`: **passed**, with `NODE_OPTIONS=--dns-result-order=ipv4first`. An earlier attempt failed with a transient TLS connection reset during Prisma engine download; retry succeeded without disabling certificate validation.
- `npm.cmd run db:generate`: **passed** after the clean install. Prisma generation is an explicit setup step: checks attempted before regeneration correctly failed because the generated client was absent, then passed after generation.
- Prisma schema validation and both committed migrations: **passed**, applied to dedicated development, test and demo databases. No reset or destructive schema push used.
- `npm.cmd run db:seed:demo`: **passed twice**, with idempotent synthetic records and credentials in ignored `.local/demo-login.txt`.
- `npm.cmd run check:env`: **passed**, variable names/status only. No provider credentials or authorised public host found.
- `npm.cmd audit --audit-level=low`: **0 vulnerabilities** at this verification. Dependencies are pinned; the `deepmerge-ts` override addresses the previous transitive advisory. This is a registry advisory result, not a security certification.
- `setup-local.ps1` was reviewed; its equivalent individual setup commands created this cluster. The full fresh-machine script has not been executed end to end on another machine.

## Static and production checks

| Command                                                        | Result                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run lint`                                             | Pass: TypeScript, React hooks and JSX accessibility rules.                                                                                    |
| `npm.cmd run typecheck`                                        | Pass after client generation; Next route types plus strict TypeScript.                                                                        |
| `npm.cmd test`                                                 | **26 passed** across domain and real PostgreSQL integration suites.                                                                           |
| `npm.cmd run test:e2e`                                         | **8 passed**, Chrome through Playwright; one worker, isolated test server/database.                                                           |
| `npm.cmd run test:e2e -- --grep 'desktop screen\|CSV preview'` | **2 passed** after final sidebar/label and screenshot-capture adjustments.                                                                    |
| `npm.cmd run build`                                            | Pass after final application changes; Next production bundle and all routes generated.                                                        |
| `npm.cmd run test:production`                                  | Pass: built server on 3101, sign-in, explicit confirmation, stop/restart, same durable session and exact totals. Separate demo database only. |
| `git diff --check`                                             | Pass: no whitespace errors.                                                                                                                   |

`next-env.d.ts` is generated and ignored. Use `db:generate` after install, `typecheck` to generate route types, and `build` before `start`. The test database is explicitly checked by scripts before migrations or fixture writes.

## What the tests establish

Domain/database tests cover exact kobo and fractional quantities; Lagos midnight; ambiguous amount/payment clarification; malformed candidates; impossible dates; stale/invalid transitions; refunds rejected; the fixed query allowlist; WAV boundaries and safe CSV export.

Real PostgreSQL transactions verify drafts do not enter reports, concurrent/idempotent confirmation, stale confirmation rejection, scoped access, rollback, expense/inventory/supplier payments and correction history. The full credit sequence verifies a ₦40,000 sale, ₦15,000 collection, import corroboration with unchanged sales/cash, then a distinct ₦25,000 collection. Import fingerprints/references, legitimate equal amounts, partial/concurrent allocation limits, unique coverage denominators, report period cutoffs, share expiry/revocation and database-client reconnection are covered.

Browser scenarios exercise mobile ambiguity-to-confirmation, collection and private report revocation; real account sign-in; denied microphone with alternatives; missing live provider returning a recoverable 503; keyboard field navigation; merchant/file isolation; cross-origin rejection; a lost request followed by one saved confirmation; CSV preview/corroboration; MediaRecorder and WAV conversion with synthetic browser audio; explicit fixture sale versus read-only fixture query; and actual authentication rate limiting. Test setup clears only the test database's authentication counters between scenarios; runtime rate limiting is enabled and asserted.

The restart smoke uses the production build, not the development server. It stops the owned app process, starts another process and checks both session and exact financial persistence. It does not restart the database or constitute a backup/restore test.

The final built app was started on `http://localhost:3000`: the home route returned **200** and an unauthenticated workspace request returned **401**. It listens on loopback only. Initial readiness polling retried while the process opened its port.

## Screens inspected

Actual browser captures were visually inspected at mobile width 390 and desktop width 1280. A loading-only desktop capture was replaced with one that waits for the merchant screen. Captures contain synthetic business examples, no credentials or share tokens.

- [Desktop record screen](screenshots/desktop-record.png)
- [Mobile clarification and read-back](screenshots/mobile-readback.png)
- [Reconciliation result](screenshots/reconciliation.png)
- [Private lender report](screenshots/lender-report.png)

The sidebar scrolls on short desktop screens; microphone/manual controls, financial read-back, demo labels and report limitations are visible. JSX accessibility lint and keyboard checks pass; a full screen-reader or WCAG audit was not performed.

## Unperformed or blocked

- **Live N-ATLAS inference:** not run; official service contract and authorised access unavailable. Scripted transcripts and deterministic English rules do not establish ASR quality or genuine N-ATLAS integration.
- **Real trader testing:** 0 sessions collected. Field kit and export exist; no participants, interactions or accuracy metrics invented.
- **Physical phone microphone, Safari/Firefox, language-assessor evaluation:** not tested. Browser recording used fake media input through real MediaRecorder/normalisation code.
- **Public deployment, organiser contact, competition submission:** not performed. No authorised destination or submission authority supplied.
- **Load/penetration testing, malware scanning, disaster recovery, automated retention and email delivery:** outside this verification.
- OCR, generated PDF, additional live languages, spoken output and WhatsApp remain deferred. Browser printing is available; no generated PDF artifact is claimed.
