# Provider integration register

Updated 12 October 2026. The application now contains a server-side adapter for the documented N-ATLAS gateway. Automated adapter tests use simulated HTTP responses. No live N-ATLAS request or real-audio accuracy test has been performed in this workspace; valid gateway credentials and an authorized gateway URL are still required.

| Capability                                | Implementation                                                                                                     | Current evidence                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Speech transcription                      | `NatlasGateway.transcribe` posts WAV audio and an explicit language to `/v1/audio/transcriptions`.                 | Mocked contract tests only; live access unknown.                                              |
| Spoken transaction extraction             | Transcript goes to N-ATLAS `/v1/chat/completions`; strict candidate parsing and existing domain validation follow. | Mocked response tests only; no accuracy claim.                                                |
| Merchant review and confirmation          | Existing versioned draft, clarification, read-back and explicit confirmation are reused.                           | Existing domain, database and browser tests; full browser suite not rerun during this change. |
| English, Yoruba, Igbo and Hausa selection | UI and server accept `en`, `yo`, `ig`, `ha`. The demo fixture is restricted to English.                            | Selection and contract are source-backed; language quality requires live tests with speakers. |
| Speech output                             | Not implemented. Read-back is displayed as text.                                                                   | Unavailable.                                                                                  |

## Official gateway contract

The [N-ATLAS Quickstart](https://natlas-docs.vercel.app/quickstart), [Gateway API](https://natlas-docs.vercel.app/gateway), [JavaScript SDK reference](https://natlas-docs.vercel.app/sdk/javascript), [integration notes](https://natlas-docs.vercel.app/integration) and [self-hosting guide](https://natlas-docs.vercel.app/self-hosting) describe an authenticated gateway. The app uses the documented HTTP API directly; no SDK package was added.

- ASR: multipart `POST /v1/audio/transcriptions`, `Authorization: Bearer …`, `file`, `language`, and JSON response `{ "text": "…" }`.
- Interpretation: JSON `POST /v1/chat/completions`, same Bearer authentication, model `NCAIR1/N-ATLaS`, and OpenAI-shaped `choices[0].message.content` response.
- Supported speech codes: `en` (Nigerian-accented English), `yo` (Yoruba), `ig` (Igbo), `ha` (Hausa). The gateway selects a language-specific ASR checkpoint.
- The browser currently normalizes recorded/uploaded audio to mono 16 kHz, 16-bit PCM WAV. The server validates that format, a maximum of 30 seconds and a 1 MB payload before forwarding it. This is narrower than the gateway's documented ffmpeg-compatible audio inputs.
- Requests have a configurable timeout (`NATLAS_TIMEOUT_MS`, default 60 seconds). Non-success responses, malformed JSON, blank transcripts and invalid model output fail without saving a transaction. The browser retains audio for retry after a provider failure.
- Model responses are treated as untrusted. The app accepts one strict candidate, normalizes it through existing financial validation, and requires the merchant to resolve missing fields, review and confirm.

## Configuration and privacy

Set `NATLAS_BASE_URL`, `NATLAS_API_KEY`, optional `NATLAS_MODEL` (defaults to `NCAIR1/N-ATLaS`) and optional `NATLAS_TIMEOUT_MS` in the server environment. The gateway URL is an authorized deployment URL; the documented public demo gateway does not publish a client key. Do not use the Hugging Face download token as the gateway Bearer key. Credentials must stay server-side and must never use a `NEXT_PUBLIC_` name.

The app does not call `/health` to claim the integration is connected. A complete-looking configuration only changes the UI to say the gateway is configured; actual authentication and service availability are checked by an inference request. A missing configuration produces a recoverable response and leaves manual entry available. The gateway's own retention, operator access, rate limits and privacy terms must be reviewed for the selected deployment. The app does not retain original audio; a successfully interpreted draft stores transcript text until the user deletes private materials. Do not claim upstream audio deletion based only on the app not storing a copy.

## N-ATLAS access and model terms

The official self-hosting guide says the model repositories are gated and require acceptance of the model terms. It describes a hosted Modal deployment and a Docker Compose deployment requiring an NVIDIA GPU with roughly 24 GB of VRAM for the 8B language model; that hardware is not assumed available for this local Windows app. The official quickstart says the published challenge demo gateway requires a Bearer key for inference and does not publish that key. Obtain authorized gateway access or operate an approved deployment before live use. Review model licensing and usage terms independently.

## Verification record

| Claim                                                    | Status                                                 |
| -------------------------------------------------------- | ------------------------------------------------------ |
| Adapter uses documented endpoint paths and request forms | Source and mocked tests                                |
| API key is only read in server code                      | Source inspection                                      |
| Valid live gateway credentials are configured            | Unknown; never print or share credentials              |
| Live `/health`, transcription or chat request succeeded  | Not tested                                             |
| Language-specific transcription quality                  | Not tested; no native-speaker or real-audio evaluation |
| Real trader validation sessions                          | 0 recorded in the existing field-test record           |

Manual bookkeeping remains usable without the gateway. The fixtures are fixed synthetic examples and are never an automatic fallback for real audio.
