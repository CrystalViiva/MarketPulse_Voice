# Provider integration register

Checked **9 October 2026**. No provider credentials were found in the workspace environment. No live audio inference was performed. `src/lib/providers.ts` defines transcription, interpretation and optional speech-output interfaces.

| Capability | Implemented path | Tested claim |
|---|---|---|
| Nigerian English transcription | Unavailable live adapter; deliberate scripted fixture adapter | Fixtures exercise workflow only; no real accuracy result |
| Interpretation | Limited deterministic English rules plus structured manual form | Explicit values only, schema validated, merchant clarification |
| Speech output | Interface boundary only | Not implemented; text read-back |
| Voice confirmation/correction | Accessible buttons/form | Not voice-operated |
| Yoruba/Hausa/Igbo/Pidgin | No live adapter selected | No tested language capability |
| WhatsApp | Deferred | No webhook/credential integration |

## Verified publisher material

[NCAIR1/NigerianAccentedEnglish model card](https://huggingface.co/NCAIR1/NigerianAccentedEnglish) documents a gated Whisper-small derivative for Nigerian-accented English, accessed through approved Hugging Face model downloads. Local inference uses Transformers ASR, recommends 16 kHz audio and demonstrates WAV loading and a `text` result. It lists a 30-second inference context. The page reports no hosted Inference Provider deployment. It is **not** a published official ASR HTTP API contract: authentication headers, upload envelope, content types, error/response schema and service URL remain unverified.

The model terms include attribution and research/innovation restrictions, with commercial licensing considerations; review the publisher's exact terms before deployment. Approval to download model weights and permission to use a hosted service are separate questions. We have not accepted terms for the user or downloaded gated weights.

[NCAIR1/N-ATLaS](https://huggingface.co/NCAIR1/N-ATLaS) documents a gated Llama-based text model and local Transformers generation. It lists English, Hausa, Igbo and Yoruba. Its examples are local text generation, not a validated structured bookkeeping response or an ASR endpoint. The [NCAIR model catalogue](https://huggingface.co/NCAIR1/models) lists separate ASR models. None have been tested in this app. Pidgin is not inferred from training-data mentions or general marketing.

## Activate a genuine integration

1. Obtain official ASR service documentation and authorised credentials/access. Confirm whether running official weights locally satisfies the Voice-First service rule; do not assume it does.
2. Record version/model/revision, language, endpoint, auth method, request envelope, accepted audio encoding, duration, response schema, rate limits and privacy/retention terms. Keep credentials only in server environment variables.
3. Implement `TranscriptionProvider` to that exact verified contract. Validate responses with Zod and enforce a timeout. Never silently select another provider or fixture. Store only provider/model/outcome/latency in Interaction.
4. Run a small consented smoke test with a known phrase and language assessor. Record expected/actual transcript, numeric accuracy, latency and request outcome without publishing raw audio or personal data.
5. Enable the capability only after that test, update UI status and this register, then conduct real trader evaluation. A provider's language listing is not proof of application-level interpretation or spoken-output quality.

The browser normalizes audio to mono 16-bit PCM WAV at 16 kHz and rejects clips over 30 seconds. The server independently validates WAV structure, encoding, size and duration. Raw audio is never stored. The fixture adapter ignores audio and returns a visibly scripted example selected by the user. It is gated by `TRANSCRIPTION_MODE=fixture` and business mode `demo`.
