# Privacy and retention

Prototype policy, 9 October 2026. Collect only account name/email, merchant-chosen aliases and the details needed for business records. Avoid customer phone numbers, account numbers and identity documents. No organiser communication or outside sharing happens automatically.

- Recording requires a consent checkbox. Audio stays in browser memory until submitted, is not logged, and is discarded after the server request. Unsent audio disappears when the page closes.
- Draft transcripts and versions persist behind merchant authentication so interrupted workflows can resume. Provider outcomes contain identity, outcome, duration and language, not audio/transcript text.
- Evidence files persist privately in PostgreSQL with merchant, actor, source and creation time. Downloads require ownership. Content is treated as untrusted; PDF/images download as attachments. Malware scanning is not implemented; only trusted test documents should be used in this prototype.
- Settings → Delete private supporting material removes all evidence, draft transcripts, evaluation sessions and shared report snapshots for the current business. Per-file deletion is also available in Ledger. Financial activity, aliases, draft versions, account records and audit history remain. There is no claim of complete personal-data erasure.
- Private links provide bearer access only to a fixed reporting snapshot, until expiry/revocation. Do not post them publicly. Revocation cannot recover copies someone already downloaded or printed.
- Evaluation consent is separate from bookkeeping consent. Use anonymous IDs and record only actually observed sessions. Do not collect names in feedback. A facilitator can withdraw a session using the documented owner-assisted deletion flow; the UI's bulk control deletes all evaluation sessions. Individual session removal is a known limitation.

Retention is manual in this local prototype: supporting material remains until deleted. Before real deployment, agree a retention period with participants, implement scheduled expiry and individual withdrawal/account-erasure procedures, configure database backups and access, and assess applicable obligations with appropriate expertise. No legal compliance certification is claimed.
