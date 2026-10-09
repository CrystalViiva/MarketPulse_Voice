# MarketPulse Voice — master prompt and VS Code guide

Prepared 8 October 2026. This package is a build specification and setup guide; the application has not been built or tested as part of preparing it.

Yes: the prompt requests a complete frontend, backend, database, authentication, integrations, tests and deployment handoff. Next.js can contain the frontend and server-side backend in one repository. You do not need to create two separate applications first.

A 24-hour target is a planning constraint, not a guarantee. API access, account setup, usage limits, deployment and real trader validation can still block completion. Keep the coding session available and review its progress; a prompt does not schedule autonomous work for 24 hours.

## 1. Before running the prompt

### Install the essentials

1. Install [Visual Studio Code](https://code.visualstudio.com/).
2. Install the **LTS** version of [Node.js](https://nodejs.org/en/download), with npm. Let Codex check compatibility with the actual project dependencies and pin the version it uses.
3. Install [Git](https://git-scm.com/install/) using your operating system's instructions.
4. Use the installation link in the [official Codex IDE guide](https://learn.chatgpt.com/docs/codex/ide) to install the OpenAI Codex extension in VS Code. Open its sidebar and complete sign-in. If the icon is missing, the guide documents the command `Codex: Open Codex Sidebar` in the Command Palette.

| System | Setup notes |
|---|---|
| Windows | Use the Windows installers and a VS Code PowerShell terminal. If PowerShell blocks `npm.ps1`, try `npm.cmd` instead of changing machine-wide execution policy. If you already use WSL, keep Node, Git, the repository and the terminal in the same WSL environment. |
| macOS | Use the macOS installation options. Open the project through VS Code's File → Open Folder; the optional `code` terminal command is not necessary. |
| Linux | Choose the VS Code package for your distribution and follow the Node.js and Git Linux installation instructions. Check that your distribution's Node version meets the project's requirements. |

Restart VS Code after installation. Open **Terminal → New Terminal**, then run these individually:

```text
node --version
npm --version
git --version
```

All three should print versions. If a command is missing, resolve that installation before starting the build. You do not need to install Next.js globally, create a React app manually, or install a collection of AI extensions.

### Create the workspace

Create an empty folder named `marketpulse-voice` in your normal projects directory. Open that folder in VS Code. Avoid using an unrelated existing project as the destination.

Save the master prompt from section 2 as `BUILD_BRIEF.md` inside that folder. It contains no secrets. Codex can initialise Git, create the application and install project dependencies.

### Have these details ready

| Detail | What to provide |
|---|---|
| First language | Choose a language that real testers speak; availability must be verified with the actual provider. |
| N-ATLAS access | Official model/ASR documentation, access instructions and credentials when available. |
| Database | An empty development PostgreSQL database or permission to configure a local one. Codex should give exact steps if neither exists. |
| Deployment | Your chosen host and account access, or say “local build first.” |
| Testing | Traders who consent to trying the product and someone able to assess the chosen language. |
| Optional services | Private object storage, speech output and WhatsApp credentials only if available. |

Missing credentials need not prevent work on the ledger and interface. They do prevent claiming the affected live integration works. Use a dedicated development database, not an existing business database.

Put secrets only in the local environment file specified by the generated README or in the host's secret settings. Do not put them in the prompt, source code, screenshots or Git. Ask Codex to identify required variable names without displaying their values.

## 2. Revised master prompt

Copy everything between START and END into `BUILD_BRIEF.md`, or paste it directly into the Codex chat for the open project.

--- START MASTER PROMPT ---

Build **MarketPulse Voice**, a complete, usable full-stack hackathon prototype in this workspace. Implement the frontend, server-side backend, persistent database, authentication, provider adapters, tests and handoff materials. Work toward a 24-hour active-build budget. Begin implementation after a concise plan; deliver working software rather than stopping at a design or scaffold.

### Product goal

Informal Nigerian traders should be able to create business records by speaking. The essential journey is:

**Speak → resolve ambiguity → hear/read back → explicitly confirm → persist → query the business.**

Voice entries, invoices and imported payments feed one consistent ledger. The outcome is an understandable business history with clear evidence labels that a trader can choose to share for lender review.

Prepare two evidence-based submission narratives around the same product:
- N-ATLAS: Voice-First Access, with genuine required N-ATLAS integration and real trader testing.
- Zenith Zecathon: SME financing evidence, reconciliation and cash-flow visibility.

These are positioning goals, not verified eligibility claims. Do not invent credit scores, approved loans, partnerships, user validation or competition compliance.

### Working rules and first actions

1. Inspect the repository, current changes, operating system, runtime and applicable repository instructions. Preserve existing work. Reuse an appropriate existing stack.
2. If this is a new project, use one Next.js/TypeScript application with server-side routes/actions, PostgreSQL, Prisma, Zod and a maintained authentication solution. Prefer npm, a committed lockfile and compatible pinned runtime/dependency versions. Avoid microservices.
3. Inspect environment-variable names and configuration availability without exposing secrets. Verify the available database and deployment route before designing around them. Do not assume Docker or a cloud account exists.
4. Check current official competition pages and linked rules: https://ncair.nitda.gov.ng/naic/ and https://beyondlimits.global/zecathonhackathon/. Record source URLs, retrieval date, competition edition/year, eligibility, deadlines, track requirements and unresolved questions. If unavailable or ambiguous, mark requirements unverified. Prior conversation mentioned official N-ATLAS ASR and 50 real interactions; treat these as claims to verify, not established current rules.
5. Verify actual N-ATLAS inference and official ASR documentation, access method, language capabilities, audio formats and response schemas. Do not invent endpoints or assume Pidgin support. Make a small real smoke test when authorised credentials permit. A missing integration blocks that feature, not independent implementation.
6. Create a short plan, a feature/status checklist and a dependency list. Begin the smallest complete journey immediately. Make routine decisions autonomously; ask only questions that materially block work.

Use the actual local operating system when writing commands. Keep development, test, fixture and production data separate. Do not send organiser messages, submit entries, purchase services or publish to a public host without the relevant user authorisation. Prepare those actions fully before requesting any final approval needed.

### Scope and completion gates

**Gate A — mandatory core:** authenticated merchant, one verified language when accessible, browser recording/upload, transcription, structured draft, clarification, explicit confirmation, persistent ledger, credit sales and debt collection, corrections, audit history, daily summary and basic voice queries. Missing live access must be visibly disclosed while fixtures support development.

**Gate B — financing evidence:** one CSV format, import preview, duplicate protection, payment reconciliation including partial payments, evidence labels and an access-controlled report/lender view.

**Gate C — only after A and B are stable:** invoice OCR, PDF export, additional verified languages, richer spoken output and WhatsApp. Basic private evidence attachment can precede OCR. A polished printable report is acceptable if PDF generation is deferred. Record every deferral honestly.

Implement access control and monetary correctness alongside the core, not as optional final polish. If time is tight, reduce Gate C first. Do not spend the build budget on a marketing landing page while bookkeeping remains incomplete.

### Interface

Build a polished mobile-first merchant app with Record, Ledger, Debts and Summary navigation. Give the microphone a prominent primary action, readable text, large targets and plain-language feedback. Use a coherent restrained visual design, naira formatting and realistic Nigerian examples. Support keyboard and screen-reader access.

Include recording, permission-denied, uploading, processing, clarification, read-back, confirmation, success, empty, retry and provider-failure states. Handle a denied microphone with audio-file upload and clearly labelled manual entry. Preserve recoverable drafts safely. Never claim offline functionality unless it works and is tested.

The lender experience should focus on the reporting period, recorded activity, evidence and missing information. Avoid presenting a score or an approval-like badge without a defensible basis.

### Voice workflow and provider boundaries

Support sales, operating expenses, credit sales, customer debt collections, inventory purchases and supplier payments/amounts owed.

Use explicit provider interfaces for transcription, interpretation and optional speech output. Implement real adapters only from verified documentation. Fixture mode must be deliberately selected and visibly labelled. In real mode, failures must produce a recoverable error; never silently return a fixture or switch to an unapproved provider.

Capture provider/model identity, request outcome and latency without logging unnecessary audio, personal information or secrets. Report language support per tested capability: transcription, interpretation and speech output may differ.

Represent conversation progress explicitly: recorded/uploaded → transcribed → draft → needs clarification → ready for confirmation → confirmed/cancelled/failed. Associate follow-ups with the current draft and validate transitions server-side.

Extract a schema-validated candidate containing type, item, quantity/unit, unit price or total, currency, local event date, counterparty alias if supplied, payment state, amount paid, outstanding amount, source and unresolved fields. Do not invent missing critical values.

For “sold five bags of rice, forty thousand,” ask whether ₦40,000 is total or per bag and whether payment was received. Do not infer payment from the word “sold.” Clarify uncertain dates and counterparties when they affect correctness. Show/speak a read-back and save only after explicit confirmation. A correction changes the draft; confirmation applies to its current version. Reject stale confirmations.

Support voice confirmation, correction, cancellation and summary where actual providers permit; retain accessible buttons. Describe missing speech output or voice controls as limitations rather than a completed end-to-end voice experience.

For voice queries, allow only a small set of intents: today's sales, this week's cash received, recorded spending, outstanding debts, today's summary and correction of the last entry. Map intents to authorised deterministic queries. AI must not generate arbitrary database queries or calculate final totals.

### Ledger and financial invariants

Use integer kobo or an exact decimal type throughout money parsing, storage, calculations and serialisation. Use decimal strings at JSON boundaries where needed. Handle quantities exactly when fractional quantities are supported. Store timestamps consistently and use Africa/Lagos for business-day boundaries.

Model economic activity separately from settlement. An invoice, a sale, an imported payment and a payment allocation are not interchangeable.

- A cash sale increases sales and cash receipts once.
- A credit sale increases sales and receivables, not cash receipts.
- A debt collection increases cash receipts and reduces receivables, not sales.
- Inventory purchases are distinct from operating expenses; neither justifies calculating profit without adequate cost data.
- Supplier debt and its settlement follow the same separation.
- Payment allocations cannot exceed available payment or debt amounts. Clarify or explicitly model excess payments instead of silently losing them.
- Refunds/reversals must link to original activity, preserve history and have documented effects; if an unsupported refund cannot be processed safely, reject it clearly.

Use database transactions, unique constraints and business-scoped idempotency keys for confirmation, imports and allocations. Protect against concurrent duplicate confirmation and concurrent over-allocation. Authorisation applies to every read and mutation, including imports, reports and file access.

Corrections use versioned amendments or reversing/replacement records with actor, reason and timestamp. Never destroy original confirmed history. Define how corrections interact with already allocated payments and require review where needed.

Maintain models for users, businesses/membership, counterparties, interactions, versioned drafts, confirmed activity, settlements/allocations, evidence, imports, matching decisions, audit events, report snapshots/shares and consented validation sessions. Keep the implementation proportionate to the prototype.

### Imports and evidence

Define one CSV template with exact columns, date/amount rules and examples. Parse, validate and preview before confirmation. Reject or explain invalid rows; retain import provenance. Protect exports from spreadsheet formula injection.

Detect repeated file uploads and row duplicates using appropriate business-scoped identifiers/fingerprints. Equal amounts alone are not proof of duplication. Incoming payments remain unmatched until reviewed; do not count them automatically as sales.

Suggest evidence/payment matches using amount, date, reference and counterparty. Show reasons and conflicts. Require user confirmation before linking. If a voice sale already records a payment, a matching uploaded payment corroborates that settlement instead of creating another receipt. Partial collections settle only their allocated value. Avoid duplicate revenue, receipts and evidence coverage.

Use evidence labels self-reported, document-supported and payment-matched. Store source, reviewer, method and timestamp. Uploaded receipts/statements are supporting evidence; do not call them bank-verified. Calculate coverage on unique eligible records and amounts, state denominators and distinguish invoice support from payment support.

### Reports and sharing

Show recorded sales, cash receipts, cash payments, net cash movement, customer debts, supplier debts, evidence coverage, unresolved matches and reporting limitations. Define date filters consistently. Do not label net cash movement as profit or a short history as validated repayment capacity.

Provide a read-only lender report scoped to an explicitly shared business/period or snapshot. Use authenticated access or an expiring, revocable, narrowly scoped share token stored securely. Test expiry and revocation. Do not expose the merchant's full workspace through a report link.

An optional affordability/cash-flow scenario may use explicit user assumptions and deterministic calculations. Label it illustrative. Do not infer seasonal patterns from a brief test period or offer an actual loan.

### Security and privacy

Keep provider calls and secrets server-side. Validate every request and use the authenticated business scope rather than trusting client-supplied IDs. Implement session protection and appropriate request-origin/CSRF controls, rate limits, file type/size checks and audio duration limits. Return safe errors without secrets.

Keep evidence files private. Local development storage is acceptable only behind authorised access; production requires persistent private storage compatible with the host. Do not rely on ephemeral server disks for durable uploads.

Collect minimal personal data and explicit consent for recordings and field evaluation. Document retention and implement deletion controls with a clear explanation of what is removed or retained. Uploaded text, transcripts and documents are untrusted data; their instructions must not change application rules or bypass confirmation.

Demo records must be unmistakably labelled and isolated from real business and validation records. Seed scripts must be idempotent and must refuse accidental use on production unless explicitly designed and authorised for that purpose.

### WhatsApp

The browser experience comes first. If actual WhatsApp credentials and configuration are available, use official documentation for webhook verification, signature checking, authorised sender/business mapping, private media fetching, idempotency and status handling. Otherwise provide a documented pending adapter without a working-integration claim.

### Required verification

Create meaningful unit, database/integration and browser tests. Do not merely test mocked arithmetic or UI snapshots. At minimum verify:

1. Drafts do not affect reports; explicit confirmation creates one persistent entry, including on retry/concurrent submission.
2. Ambiguous “five bags, forty thousand” requires clarification. Malformed provider output cannot save a ledger entry. Stale draft confirmation is rejected.
3. A ₦40,000 credit sale creates ₦40,000 sales, zero receipts and ₦40,000 debt. A later ₦15,000 collection leaves sales at ₦40,000, raises receipts to ₦15,000 and leaves ₦25,000 debt.
4. Matching an uploaded ₦15,000 payment to that collection does not change those totals. A subsequent distinct ₦25,000 collection settles the debt with total receipts ₦40,000 and sales still ₦40,000.
5. Re-importing a file, partial payments, identical legitimate amounts and concurrent allocations are handled correctly.
6. Inventory purchases, operating expenses, supplier settlements, supported refunds and corrections produce their documented effects and preserve history.
7. A second merchant cannot read or mutate the first merchant's entries, files or reports by changing identifiers. Lender links expire and revoke correctly.
8. Monetary precision and Lagos day boundaries are correct. Evidence coverage does not exceed its denominator through double-counting.
9. Provider failure, missing credentials, denied microphone access and network retries produce truthful usable states. Persistence survives an application restart.
10. The mobile record-to-confirmation journey and lender report render correctly. Inspect actual screens where browser tooling is available; otherwise document the unperformed check.

Run type checks, lint, tests and a production build. Apply migrations to a disposable development/test database. Record commands, outcomes and relevant limitations. Mocked-provider tests and real ASR/model smoke tests must be reported separately. Never mark an unrun test as passed.

### Real trader validation

Implement a consent-based evaluation flow and export with anonymised participant ID, language, task, timestamp, expected/confirmed amount, system result, correction, completion time, outcome and brief feedback. Keep synthetic tests separate. Provide a practical facilitator script and a blank evidence template. Calculate observed metrics with denominators and sample size. Never populate missing real sessions with fabricated examples or count developer requests as trader validation.

### Reproducibility and handoff

Maintain `STATUS.md` with working, tested, fixture-only, blocked and deferred features; exact next action; dependency blockers; and latest verification. Write a concise architecture/decision record and beginner-readable README. Keep Git checkpoints without committing secrets or unrelated changes. If interrupted, leave a resumable state rather than rebuilding from scratch next time.

Provide documented npm scripts for `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:deploy`, `db:seed:demo` and `check:env`, or document equivalents if preserving an existing repository. Explain each script and which database it targets. Environment checking must reveal missing variable names, never values. Ensure scripts load configuration consistently; do not assume the app and database CLI read the same environment file automatically.

Supply `.env.example`, schema/migrations, a CSV template, isolated demo data, setup/recovery/deployment steps, validation evidence, integration documentation, known limitations, field-testing materials, a 3–5 minute N-ATLAS demo script, a concise Zenith script and separate submission drafts based on actual implementation. Leave missing metrics as explicit placeholders. Draft but do not send an organiser enquiry about dual entry, project reuse and award eligibility.

Deploy and smoke-test if an authorised suitable destination is available. Otherwise deliver a verified runnable local app and host-specific steps once the host is known. Report public deployment separately from local success. Do not publish private demo credentials or user data.

Budget guide: spend the first part on dependency checks and the first complete journey; the middle on correct ledger behaviour, security, imports and reports; reserve substantial time for integration tests, UI checks and handoff. Do not claim 24 hours have elapsed or that completion is guaranteed. Prefer a smaller verified product over unfinished optional features.

Your final handoff must state what works, exact run commands, tests performed, real versus fixture versus blocked integrations, the deployed/local URL, what the user must supply, and whether either submission remains incomplete. Start now with workspace and service-access inspection, then implement Gate A.

--- END MASTER PROMPT ---

## 3. Start Codex in VS Code

Open the `marketpulse-voice` folder and the Codex sidebar. If you saved the prompt as `BUILD_BRIEF.md`, send:

```text
Read BUILD_BRIEF.md in this workspace and execute it. First check the local environment, then begin implementation. I need both the frontend and backend. Preserve a resumable STATUS.md and continue independent work if an external service is blocked.
```

Let Codex edit the project and run appropriate commands within your configured permissions. Keep normal permission controls; do not disable them to make the prompt work. When account access is required, follow the service's sign-in/setup flow. You can keep building in fixture mode while obtaining N-ATLAS access, but the real voice requirement will remain incomplete.

## 4. After Codex finishes

Start with its generated README and final handoff. The commands below are the script contract requested by this prompt; **they are not commands for an application already created by this document**. If a script is missing, have Codex implement or document it rather than guessing.

1. Check `STATUS.md` for blocked integrations and unrun tests.
2. Follow the README to create the environment file and fill in local credentials. Confirm the database is a dedicated development database.
3. Run the documented setup. For the requested new-project npm setup, the expected sequence is:

```text
npm ci
npm run check:env
npm run db:generate
npm run db:migrate
npm run dev
```

`npm ci` expects the committed lockfile. Development migrations can change the database; check the configured target first. Demo seeding is optional and must remain isolated from real records. Open the local URL printed by the server, commonly `http://localhost:3000`.

4. Use another terminal for checks:

```text
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

Follow the README for the browser test prerequisites and test database. To check production mode, stop the development server with Ctrl+C, then run `npm run start` after a successful build.

5. Manually try one ambiguous sale, one credit sale, one partial repayment and one matching import. Refresh the browser and confirm persistence. Test access using a second merchant account. Confirm that fixture banners are visible wherever simulated providers are used.
6. Test real microphone access on the intended devices. Use the deployed HTTPS URL for phone testing; a phone's `localhost` refers to the phone, not your laptop.
7. Configure deployment secrets, private persistent storage and production migrations using the generated deployment guide. A local build passing does not prove deployment or live ASR works.

### If the session stops or something fails

Resume in the same project with:

```text
Read BUILD_BRIEF.md, STATUS.md and the current repository changes. Resume from the next incomplete acceptance gate. Preserve completed work. First identify what is implemented, tested, fixture-only and blocked; then continue implementation and verification. Do not rebuild from scratch.
```

For an error, provide its exact redacted text and the command that produced it:

```text
This command failed: [command]. Here is the error with secrets removed: [error]. Find the cause, fix it, rerun the relevant check and update STATUS.md. Preserve existing data and do not reset the database without explaining why and obtaining any necessary authorisation.
```

Before submission, confirm the applicable competition edition and rules, actual integration evidence, consented real-user results, demo recording and any unresolved dual-entry question. The generated source code alone does not establish competition readiness.

## Official setup references

- [VS Code](https://code.visualstudio.com/)
- [Node.js downloads](https://nodejs.org/en/download)
- [Git installation by operating system](https://git-scm.com/install/)
- [Codex IDE installation and editor workflow](https://learn.chatgpt.com/docs/codex/ide)

Setup references checked 8 October 2026. Competition and provider requirements are deliberately assigned to the build-time verification step; this package does not certify them.
