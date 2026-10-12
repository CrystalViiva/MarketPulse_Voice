# N-ATLAS live integration record

Use one record per real live test. Never include a Bearer key, raw audio, participant identity or private transaction details. This file is a blank template, not evidence that a live request succeeded.

- Date/time (WAT): [fill in]
- Gateway deployment label (no secret URL query parameters): [fill in]
- Model identifier reported/configured: [fill in]
- Language code (`en`, `yo`, `ig`, `ha`): [fill in]
- Consent recorded: [yes/no]
- Synthetic phrase or approved task reference: [fill in; avoid personal details]
- HTTP outcome category: [success / auth rejected / rate limited / timeout / upstream error / invalid response]
- ASR transcript assessed by: [fill in]
- Transcript word/error metric and denominator: [fill in]
- Extracted transaction fields correct: [fields and count]
- Merchant correction required: [yes/no; describe field only]
- End-to-end latency: [measured value or not measured]
- Audio retained by this app after request: no
- Gateway retention/access terms reviewed: [yes/no/unknown]
- Notes and limitations: [fill in]

Do not present a mock test, `/health` response, or environment-variable presence as a successful live inference test.
