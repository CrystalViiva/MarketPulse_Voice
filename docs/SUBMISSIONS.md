# Submission drafts — incomplete, not sent

Both narratives describe the same implementation. See [competition register](COMPETITIONS.md) for dated sources and unresolved rules. Replace brackets only with genuine evidence.

## N-ATLAS / Voice-First Access narrative

MarketPulse Voice aims to help informal Nigerian traders turn spoken business activity into records they understand and control. Its critical design is clarification before commitment: an ambiguous amount stays a draft until the merchant resolves whether it is a total or unit price, checks payment status and date, reads back the result, and explicitly confirms the current version.

The implemented prototype provides authenticated business isolation, recoverable versioned drafts, an exact-kobo ledger, customer and supplier debt settlement, corrections with retained history, deterministic business queries, CSV reconciliation and private reports. The browser supports recording and audio uploads, and source now includes an adapter for the documented N-ATLAS transcription and chat gateway. The local workspace has no N-ATLAS endpoint/key configured, so live inference remains **unverified and unavailable here**. Current demo transcription is scripted and visibly labelled. Spoken output and voice controls are not completed.

Integration evidence: **[authorized gateway, successful live request and latency pending]**. Real trader evidence: **[consented participants, documented interactions and measured results pending]**. The app includes a facilitator form/export, but no real validation has been invented. This draft must not be submitted as a completed Voice-First build until those gates and team eligibility are resolved.

### 4-minute demonstration script

0:00–0:30 — Explain the merchant bookkeeping problem and show authentication. State whether the demo uses fixtures or verified live ASR.

0:30–1:30 — Record/upload the ambiguous rice example. If live integration remains blocked, explicitly choose a scripted demo and say it does not demonstrate ASR. Resolve total/per-unit, date and payment; show read-back and confirm.

1:30–2:20 — Show the ₦40,000 credit sale and collect ₦15,000. Explain unchanged sales and ₦25,000 remaining debt. Refresh to show persistence.

2:20–3:10 — Preview a payment CSV, corroborate the collection and show unchanged cash totals. Open the audit history and evidence labels.

3:10–3:40 — Ask a supported business question and open a narrowly scoped lender snapshot. Revoke its link.

3:40–4:00 — Show actual verification results, separate real-user evidence if collected, and disclose outstanding integration/validation work. No fabricated success metrics.

## Zenith SME financing-evidence narrative

Small merchants can struggle to assemble an understandable history from sales, debts and incoming transfers. MarketPulse Voice creates a merchant-controlled record that separates economic activity from cash settlement, then adds transparent supporting evidence.

A ₦40,000 credit sale records sales and debt. A ₦15,000 collection reduces debt without recording another sale. A matching imported transfer supports that receipt without adding a second cash inflow. The merchant sees why a payment might match and confirms the decision. A private report shows a defined period, recorded sales, cash movement, debts, document/payment coverage and unresolved payments. Uploaded material is supporting evidence, never labelled bank-verified.

The product is an evidence-preparation tool for lender review. It does not issue a score, assess validated repayment capacity, approve credit or imply a bank partnership. Intended positioning is SME financing visibility, subject to current track confirmation. Measurable impact remains **[real completion, error reduction and trader feedback pending]**. Team: **[names, roles, eligibility and original-work declarations pending]**. Deployment: local prototype; no public host authorised. Live AI speech integration remains pending.

### Concise pitch script (90 seconds)

“A sale, its payment and a bank-statement row are three views of an event—not three sales. MarketPulse Voice helps a trader build a clear business history, with confirmation before anything enters the book. Here is a credit sale, a partial collection and a statement match. Notice that revenue stays the same. The private report shows recorded cash movement, what is owed, what evidence exists and what is missing. The merchant chooses what period to share and can revoke the link. This is a working local bookkeeping and evidence prototype. Live speech access and real trader outcome measurement are still pending; no loan or credit score is being claimed.”

### Six-slide outline

1. Merchant problem: fragmented records and uncertain cash/debt history.
2. Workflow: clarify, read back, confirm; merchant retains control.
3. Working ledger demonstration: sale/settlement/import separation.
4. Evidence: provenance, partial matching, coverage denominators, limitations.
5. Validation and implementation: actual test results; real-user metrics pending; integration blockers.
6. Team, intended pilot, operational needs and next steps; no invented traction or partnerships.

## Organiser enquiry draft — do not send without authorisation

Subject: Clarification of current edition, project reuse and Voice-First service requirements

Hello,

We are developing MarketPulse Voice, a merchant bookkeeping and financing-evidence prototype. Before preparing any entry, please clarify whether the same underlying project may be entered in NAIC and Zecathon, whether a later award affects eligibility in the other programme, and whether prior development is permitted for the live hackathon.

For NAIC, please confirm the enterprise team-size rule, how to access the official ASR service, whether inference using approved official model weights qualifies, and how real user interactions should be documented.

For Zecathon, please confirm the applicable 2026 track list and exact application cutoff time/timezone, given the older content still visible on the page. Please point us to any additional binding rules or application terms.

We are not claiming an approved integration or competition eligibility. Thank you.

[Team contact to be supplied]
