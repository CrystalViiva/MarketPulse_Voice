# MarketPulse Voice — build status

Started 9 October 2026. Target: up to 24 active build hours, not a claim of elapsed time.

## Plan
1. Isolated local PostgreSQL, pinned Next.js/TypeScript, Prisma and Better Auth.
2. Merchant → draft → clarification → versioned confirmation → ledger.
3. Credit and supplier debts, settlement, corrections, CSV reconciliation, private reports.
4. Unit/database/browser verification, production build, handoff and honest submission drafts.

## Checklist
- [ ] Authenticated merchant and business isolation
- [ ] Explicit draft transitions and stale/concurrent confirmation protection
- [ ] Exact kobo ledger, settlements, debt collection and corrections
- [ ] Recording/upload, labelled fixtures, provider failure and safe recovery
- [ ] CSV preview/deduplication/reconciliation
- [ ] Evidence, private report snapshots, revocation and expiry
- [ ] Consented evaluation and export
- [ ] Tests, browser inspection and runnable production build
- [ ] Handoff, competition research and submission drafts

## Dependencies and findings
- Windows / PowerShell; Node 24.19.0, npm 11.17.0; use npm.cmd (execution policy blocks npm.ps1).
- PostgreSQL 17.10 installed. Existing service on 5432 will not be modified. Dedicated cluster planned on 5434.
- Docker daemon unavailable; not required.
- No environment configuration, provider credentials or authorised public host found.
- N-ATLAS ASR gated model documentation found; official hosted ASR service contract/access still unverified. No live smoke test yet.
- Real trader validation requires consented participants; none recorded.
- Gate C (OCR, WhatsApp, extra languages, generated PDF, richer speech) deferred until core verification.

## Next action
Implement and verify the database-backed confirmation journey. Preserve the supplied build package.
