# MarketPulse Voice — build status

Updated 9 October 2026. The local bookkeeping prototype is implemented. The build target is up to 24 active hours; this is not an elapsed-time claim. **Neither competition submission is complete.** Live N-ATLAS access and real trader evaluation remain external dependencies.

## Delivered checklist

- [x] Next.js/TypeScript frontend and server routes, PostgreSQL migrations, Prisma, Zod and Better Auth.
- [x] Authenticated merchant, business isolation, durable sessions and request limits.
- [x] Browser recording/upload, consent, real upload progress, denied-microphone and provider-failure recovery, labelled manual entry.
- [x] Schema-validated drafts, ambiguity clarification, text read-back, explicit current-version confirmation, cancellation and recovery of saved drafts.
- [x] Integer-kobo activity and settlement ledger; credit sales, partial customer collections, expenses, inventory and supplier debts/payments.
- [x] Idempotent confirmation/import/matching, transaction locking, stale-version and over-allocation rejection.
- [x] Linked corrections with preserved originals, versions and audit history. Corrections after later payment allocations require review and are blocked.
- [x] CSV template, preview, duplicate/conflict handling and reviewed payment reconciliation without double-counted receipts.
- [x] Private evidence attachments, clear evidence denominators, period summaries, expiring/revocable report snapshots and printable lender view.
- [x] Consented real-session evaluation form, anonymised CSV export and observed metrics; synthetic businesses cannot submit real evaluation sessions.
- [x] Database, browser and restart test suites, local setup/recovery scripts, deployment handoff and two honest submission narratives.
- [ ] Genuine official N-ATLAS ASR integration and a consented real inference smoke test.
- [ ] Verified end-to-end spoken language capability and 50 documented real interactions for the published Voice-First requirement.
- [ ] Confirm team eligibility, conflicting competition details and project-reuse terms; review and submit only with authorisation.

## Capability boundaries

| Gate                    | Status                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A: bookkeeping core     | Implemented and exercised against PostgreSQL. Manual entry and narrow English interpretation work. Recording works in the tested browser; live transcription is blocked. Text read-back and button confirmation are available. |
| A: voice/query pipeline | Deliberate scripted transcripts in demo mode exercise draft and six deterministic query intents. Real ASR, voice correction/confirmation and spoken output are not working integrations.                                       |
| B: financing evidence   | Implemented: one CSV format, partial allocations, corroboration, private attachments, evidence labels, snapshots, expiry and revocation. Uploaded payments are supporting evidence, not bank verification.                     |
| C                       | Private attachments and printable report delivered. OCR, generated PDF, additional verified languages, richer speech and WhatsApp deferred.                                                                                    |

The current local `.env` deliberately enables fixture examples for **demo businesses only**. Fresh setup defaults to disabled. Real businesses reject fixture transcription and synthetic `EXAMPLE-` CSV rows. No real trader sessions have been collected.

## Environment and dependencies

- Windows PowerShell; Node 24.19.0 / npm 11.17.0. Exact packages and lockfile are committed; use `npm.cmd`.
- Dedicated PostgreSQL 17.10 cluster in ignored `.local/postgres`, listening only at `127.0.0.1:5434`. Separate `marketpulse_dev`, `marketpulse_test`, `marketpulse_demo` databases. Existing service on port 5432 is unchanged. Production must use another database.
- Local secrets are in ignored `.env`; generated demo credentials are in ignored `.local/demo-login.txt`. No provider credentials or authorised public host were found. Docker is not required.
- NCAIR publishes gated model documentation, but no usable official hosted ASR contract/access was available. No endpoint has been invented and no fallback provider is silently used. See [provider register](docs/PROVIDERS.md).
- Team identities/eligibility and consented traders/language assessor are still needed. Official competition pages were checked; conflicts and unavailable linked forms are recorded in [competition research](docs/COMPETITIONS.md).

## Latest verification

Clean `npm ci`, Prisma generation/migrations, lint and typecheck passed. **26 unit/PostgreSQL tests and 8 browser scenarios passed**, with 2 affected browser scenarios rerun after final layout/capture adjustments. The final production build and full app-process restart smoke test passed. Dependency audit: **0 vulnerabilities**. Actual mobile, desktop, reconciliation and lender screenshots were inspected. See [verification record](docs/VERIFICATION.md) for commands, evidence and limits.

## Exact next action

Open `http://localhost:3000`, create an account and choose a real or demo business. If the app is stopped, follow the [README](README.md) and run `npm.cmd start` for the existing production build. For the live voice milestone, obtain official ASR documentation/access, implement the verified contract, record a consented smoke test, then conduct real trader testing using [the facilitator materials](docs/FIELD_TESTING.md). Do not count synthetic tests toward real validation.

## Known limits

No offline operation, email verification/password recovery, team invitations, payment refunds/reversals, automated bank verification, OCR or WhatsApp. All business data is loaded for this small prototype; pagination and operational scaling remain future work. Deletion removes private materials but preserves account and financial history as documented in [privacy notes](docs/PRIVACY.md). No credit score, lending decision, partnership, user-validation claim or competition-compliance claim is made.
