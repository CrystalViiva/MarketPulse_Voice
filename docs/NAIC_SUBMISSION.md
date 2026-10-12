# MarketPulse Voice — NAIC project brief

## Project overview

MarketPulse Voice is a bookkeeping and financial-record tool designed for Nigerian microbusinesses. It aims to help traders maintain a useful record of sales, expenses, customer balances, payments, and supporting evidence, including when they cannot rely on formal accounting software.

The product is built around merchant control: an incomplete or ambiguous entry remains a draft. The merchant can clarify and review the details, read them back on screen, and explicitly confirm the current version before it becomes a financial record.

## What the prototype does

- Provides authenticated business accounts with records scoped to the signed-in owner.
- Records sales, expenses, inventory activity, settlements, and allocations in integer kobo.
- Separates economic activity from cash received or paid, so a credit sale and its later collection are not counted as two sales.
- Supports versioned drafts, clarification, confirmation, corrections with retained history, CSV payment reconciliation, private evidence attachments, date-based summaries, and revocable report snapshots.
- Offers manual entry when voice services are unavailable.
- Includes a server-side N-ATLAS gateway adapter for WAV transcription followed by structured transaction interpretation. Provider output is validated and remains a suggestion until merchant confirmation.

## Architecture and technology

The application uses Next.js App Router, React, TypeScript, PostgreSQL, Prisma ORM, Better Auth, and Zod. The browser communicates with server routes; authentication and business ownership are checked server-side. PostgreSQL stores authentication data, bookkeeping records, evidence, audit history, and evaluation records. The N-ATLAS credential is intended to remain on the server. See [the architecture overview](ARCHITECTURE.md) and [provider record](PROVIDERS.md).

## Safety, privacy, and security considerations

The prototype requires authentication for private workflows, resolves business scope from the signed-in user, validates request and provider data, applies database-backed request limits, checks mutation origins, and limits supported audio to bounded WAV uploads. Transactions require explicit confirmation; provider responses cannot directly create ledger entries. Evidence and financial records are stored in PostgreSQL rather than public file URLs. Audio is not intended to be retained by the application after processing; transcripts may remain with drafts until private materials are deleted.

These controls are source- and test-backed prototype measures, not a production security certification. Provider retention terms, production access controls, operational monitoring, backup restoration, load testing, and a full external security review remain outstanding.

## Testing and evidence

The project verification record reports passing local lint and type checks, 26 unit/PostgreSQL tests, 8 Playwright browser tests, a production build, and a process-restart persistence smoke test. Tests use synthetic business data; mocked provider tests are not live AI evidence. See [VERIFICATION.md](VERIFICATION.md) for commands, test scope, and limits.

## Current limitations and submission honesty

**Production deployment has not been performed or verified. Live N-ATLAS inference has not been performed or verified.** The presence of an adapter in source code does not prove that a live service request succeeds. Speech quality across Nigerian English, Yoruba, Igbo, and Hausa has not been measured with real audio or native-speaker review.

No real trader sessions or accuracy metrics have been collected; the recorded real-user session count is zero. Automated tests and scripted demo examples must not be presented as participant evidence. Team eligibility, current challenge rules, and any required endorsements or registrations must be confirmed separately. Do not claim deployment, service availability, participant validation, or challenge compliance without new evidence.

## Application details to complete

Supply and verify team names, roles, eligibility, contact information, and any required declarations directly in the official application. Add only truthful, current evidence for a live service test, deployment, user study, or endorsement. This brief documents the repository state; it does not assert that an application was submitted or accepted.
