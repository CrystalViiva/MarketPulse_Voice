# Real-user validation protocol

This folder is for actual, consented user research. Automated tests, synthetic demo fixtures, staff rehearsals and mocked N-ATLAS responses are **not participant sessions**. The existing validation register reported zero real trader sessions when this document was prepared. Update counts only from consented records.

## Before a session

1. Explain that MarketPulse Voice is a prototype bookkeeping tool, not a lender, credit score or financial adviser.
2. Explain that speech audio will be sent to the configured N-ATLAS gateway for transcription when live service is configured. The app does not retain the original audio after the request, but the gateway operator's retention and access terms are separate and must be checked before the pilot.
3. Ask for separate, informed consent for audio processing and for recording anonymous evaluation outcomes. Participation is optional; the participant can stop at any time.
4. Ask participants to use a real or plausible example without customer names, account numbers, phone numbers or other people's private details. Use a real business account only with the owner's permission; never use the synthetic demo as evidence of live-user performance.
5. Assign a random participant code. Do not put the participant's name or contact details in the app. If withdrawal requires a re-identification key, keep it separately with restricted access.

## During and after

- Record language, task, outcome, duration if measured reliably, transcript quality, financial-field correctness, corrections, assistance and optional feedback separately.
- The CSV export is scoped to the authenticated business. Do not publish raw exports; remove direct identifiers and review comments for accidental personal or financial details first.
- Report the denominator for every accuracy rate. Transcript accuracy should be assessed against a consented, human-checked reference transcript. Transaction-field accuracy (type, amount, date, payment state and category) is a separate measure.
- Keep unsuccessful, incomplete and assisted interactions in the count. Distinguish user attempts from network retries; retries do not create additional participants.
- A user may request deletion of evaluation data. The current app has a whole-business private-material deletion action, but no individual-session delete control. Explain that limitation before consent and arrange owner-assisted deletion when needed. Separately delete any facilitator-held exports.

## Templates and reporting

- [Field checklist](../FIELD_TESTING.md)
- [Blank results template](../challenge/results-report-template.md)
- Existing export header: [validation-template.csv](../validation-template.csv)

Leave metrics blank or mark them “not collected” until supported by actual records. Automated, mocked and demo results must be reported separately and never counted toward real-user targets.
