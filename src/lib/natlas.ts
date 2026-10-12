import { z } from 'zod';
import { AppError, Candidate, candidateSchema, normalizeCandidate } from './domain';
import type { InterpretationProvider, TranscriptionProvider } from './providers';

export const natlasLanguages = ['en', 'yo', 'ig', 'ha'] as const;
export type NatlasLanguage = (typeof natlasLanguages)[number];

export function hasNatlasCredentials() {
  const baseURL = process.env.NATLAS_BASE_URL?.trim() ?? '';
  const apiKey = process.env.NATLAS_API_KEY?.trim() ?? '';
  return Boolean(
    baseURL &&
    apiKey &&
    !/your-authorized|\.example(?:\/|$)/i.test(baseURL) &&
    !/^replace/i.test(apiKey),
  );
}

type NatlasOptions = {
  baseURL?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

const transcriptResponse = z.object({ text: z.string().trim().min(1).max(10000) });
const chatResponse = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().min(1) }) })).min(1),
});

export class NatlasGateway implements TranscriptionProvider, InterpretationProvider {
  readonly identity: { provider: string; model: string };
  private readonly baseURL: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(options: NatlasOptions = {}) {
    this.baseURL = options.baseURL ?? process.env.NATLAS_BASE_URL;
    this.apiKey = options.apiKey ?? process.env.NATLAS_API_KEY;
    this.model = options.model ?? process.env.NATLAS_MODEL ?? 'NCAIR1/N-ATLaS';
    const configuredTimeout = options.timeoutMs ?? Number(process.env.NATLAS_TIMEOUT_MS ?? 60000);
    this.timeoutMs = Number.isInteger(configuredTimeout)
      ? Math.min(Math.max(configuredTimeout, 1000), 180000)
      : 60000;
    this.fetcher = options.fetcher ?? fetch;
    this.identity = { provider: 'N-ATLAS gateway', model: this.model };
  }

  private endpoint(path: string) {
    if (!this.baseURL || !this.apiKey)
      throw new AppError(
        'N-ATLAS is not configured yet. Your recording was not sent. Use manual entry or ask the administrator to configure the service.',
        503,
      );
    let base: URL;
    try {
      base = new URL(this.baseURL);
    } catch {
      throw new AppError('N-ATLAS configuration is invalid. Your recording was not sent.', 503);
    }
    if (
      !['https:', 'http:'].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      (process.env.NODE_ENV === 'production' && base.protocol !== 'https:')
    )
      throw new AppError('N-ATLAS configuration is invalid. Your recording was not sent.', 503);
    if (!this.model.startsWith('NCAIR1/'))
      throw new AppError(
        'N-ATLAS model configuration is invalid. Your recording was not sent.',
        503,
      );
    const prefix = base.pathname.replace(/\/+$/, '').replace(/\/v1$/, '');
    return new URL(`${prefix}/v1/${path}`, base.origin);
  }

  private async request(url: URL, init: RequestInit): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, {
        ...init,
        signal: controller.signal,
        headers: { ...init.headers, Authorization: `Bearer ${this.apiKey}` },
      });
      if (!response.ok) {
        const message =
          response.status === 401 || response.status === 403
            ? 'N-ATLAS did not accept its configured credentials.'
            : response.status === 429
              ? 'N-ATLAS is busy. Keep this recording and try again shortly.'
              : 'N-ATLAS could not process this request. Keep this recording and retry or use manual entry.';
        throw new AppError(message, response.status === 429 ? 503 : 502);
      }
      const body = await response.text();
      if (body.length > 262144)
        throw new AppError('N-ATLAS returned an oversized response. Please retry later.', 502);
      return body;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (controller.signal.aborted)
        throw new AppError(
          'N-ATLAS took too long to respond. Your recording is kept for retry.',
          504,
        );
      throw new AppError('N-ATLAS could not be reached. Your recording is kept for retry.', 503);
    } finally {
      clearTimeout(timer);
    }
  }

  async transcribe(audio: Buffer, language: string) {
    const lang = z.enum(natlasLanguages).parse(language);
    const url = this.endpoint('audio/transcriptions');
    const form = new FormData();
    form.set('file', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), 'recording.wav');
    form.set('language', lang);
    form.set('response_format', 'json');
    const body = await this.request(url, { method: 'POST', body: form });
    let value: unknown;
    try {
      value = JSON.parse(body);
    } catch {
      throw new AppError(
        'N-ATLAS returned an unreadable transcript. Keep the recording and retry.',
        502,
      );
    }
    const parsed = transcriptResponse.safeParse(value);
    if (!parsed.success)
      throw new AppError(
        'N-ATLAS returned an empty or invalid transcript. Keep the recording and retry.',
        502,
      );
    return { text: parsed.data.text };
  }

  async interpret(text: string, source: Candidate['source'], language: string = 'en') {
    const lang = z.enum(natlasLanguages).parse(language);
    const url = this.endpoint('chat/completions');
    const body = await this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        max_tokens: 500,
        language: lang,
        messages: [
          {
            role: 'system',
            content:
              'Extract at most one completed Nigerian small-business financial event from the transcript. If there are multiple separate events, do not select one; return null for all transaction fields so the merchant can enter them separately. Return only one JSON object matching the requested fields. Never guess. For missing or ambiguous type, item, total, payment state, counterparty when money is owed, or explicit event date, use null. Do not treat a question or future plan as a completed event. Currency must be NGN. Allowed type: SALE, EXPENSE, INVENTORY, COLLECTION, SUPPLIER_PAYMENT. paymentState: paid, unpaid, partial, or null. source must be voice. quantity and money values must be decimal strings. debtActivityId, outstandingAmount and amountPaid should be null unless explicitly stated; application validation will calculate derived amounts. Use ISO YYYY-MM-DD only when the transcript explicitly gives a date; otherwise null. The schema fields are type, item, quantity, unit, unitPrice, total, currency, eventDate, counterparty, paymentState, amountPaid, outstandingAmount, debtActivityId, source, unresolvedFields. Use null for absent scalar fields and [] for unresolvedFields.',
          },
          { role: 'user', content: `Speech language: ${lang}. Transcript: ${text}` },
        ],
      }),
    });
    let value: unknown;
    try {
      value = JSON.parse(body);
    } catch {
      throw new AppError(
        'N-ATLAS returned an unreadable suggestion. Your recording is kept for retry.',
        502,
      );
    }
    const chat = chatResponse.safeParse(value);
    if (!chat.success)
      throw new AppError(
        'N-ATLAS returned an invalid suggestion. Your recording is kept for retry.',
        502,
      );
    let candidate: unknown;
    try {
      candidate = JSON.parse(chat.data.choices[0].message.content);
    } catch {
      throw new AppError(
        'N-ATLAS could not structure this statement. Please use manual entry.',
        422,
      );
    }
    const parsed = candidateSchema.safeParse({
      ...(candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {}),
      source,
    });
    if (!parsed.success)
      throw new AppError(
        'N-ATLAS returned an incomplete suggestion. Please use manual entry or clarify the statement.',
        422,
      );
    try {
      return normalizeCandidate(parsed.data);
    } catch {
      throw new AppError(
        'N-ATLAS suggestion needs correction. Please review it or use manual entry.',
        422,
      );
    }
  }
}
