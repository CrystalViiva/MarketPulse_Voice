import { describe, expect, it, vi } from 'vitest';
import { NatlasGateway } from '../src/lib/natlas';

describe('N-ATLAS gateway adapter', () => {
  it('fails clearly before any request when credentials are missing', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const provider = new NatlasGateway({ baseURL: '', apiKey: '', fetcher });
    await expect(provider.transcribe(Buffer.from('audio'), 'en')).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('not configured'),
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uses the documented authenticated multipart transcription contract', async () => {
    let captured: { url: string; init?: RequestInit } | undefined;
    const fetcher: typeof fetch = async (input, init) => {
      captured = { url: String(input), init };
      return Response.json({ text: 'Sold tomatoes for eight thousand naira.' });
    };
    const provider = new NatlasGateway({
      baseURL: 'https://gateway.example.test/v1/',
      apiKey: 'test-only-gateway-key',
      fetcher,
    });
    await expect(provider.transcribe(Buffer.from('wav bytes'), 'yo')).resolves.toEqual({
      text: 'Sold tomatoes for eight thousand naira.',
    });
    expect(captured?.url).toBe('https://gateway.example.test/v1/audio/transcriptions');
    expect(new Headers(captured?.init?.headers).get('authorization')).toBe(
      'Bearer test-only-gateway-key',
    );
    const form = captured?.init?.body as FormData;
    expect(form.get('language')).toBe('yo');
    expect(form.get('response_format')).toBe('json');
    expect((form.get('file') as File).name).toBe('recording.wav');
  });

  it('validates the transcript response and rejects an empty transcript', async () => {
    const provider = new NatlasGateway({
      baseURL: 'https://gateway.example.test',
      apiKey: 'test-only-gateway-key',
      fetcher: async () => Response.json({ text: '   ' }),
    });
    await expect(provider.transcribe(Buffer.from('wav bytes'), 'en')).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining('empty or invalid transcript'),
    });
  });

  it('maps an authenticated N-ATLAS suggestion through the existing candidate validator', async () => {
    const candidate = {
      type: 'SALE',
      item: 'Tomatoes',
      quantity: null,
      unit: null,
      unitPrice: null,
      total: '8500',
      currency: 'NGN',
      eventDate: '2026-10-10',
      counterparty: null,
      paymentState: 'paid',
      amountPaid: null,
      outstandingAmount: null,
      debtActivityId: null,
      source: 'manual',
      unresolvedFields: [],
    };
    let captured: { url: string; body?: string } | undefined;
    const provider = new NatlasGateway({
      baseURL: 'https://gateway.example.test',
      apiKey: 'test-only-gateway-key',
      fetcher: async (input, init) => {
        captured = { url: String(input), body: String(init?.body) };
        return Response.json({
          choices: [{ message: { content: JSON.stringify(candidate) } }],
        });
      },
    });
    const result = await provider.interpret(
      'I sold tomatoes for 8500 and got paid today.',
      'voice',
      'en',
    );
    expect(captured?.url).toBe('https://gateway.example.test/v1/chat/completions');
    expect(captured?.body).toContain('NCAIR1/N-ATLaS');
    expect(result).toMatchObject({
      type: 'SALE',
      item: 'Tomatoes',
      total: '8500',
      paymentState: 'paid',
      source: 'voice',
    });
  });

  it('does not accept malformed upstream JSON as a financial suggestion', async () => {
    const provider = new NatlasGateway({
      baseURL: 'https://gateway.example.test',
      apiKey: 'test-only-gateway-key',
      fetcher: async () => Response.json({ choices: [{ message: { content: 'not JSON' } }] }),
    });
    await expect(provider.interpret('I sold something', 'voice', 'en')).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('could not structure'),
    });
  });

  it('returns a safe credential error without echoing upstream response content', async () => {
    const provider = new NatlasGateway({
      baseURL: 'https://gateway.example.test',
      apiKey: 'test-only-gateway-key',
      fetcher: async () => new Response('sensitive upstream body', { status: 401 }),
    });
    await expect(provider.transcribe(Buffer.from('wav bytes'), 'en')).rejects.toMatchObject({
      status: 502,
      message: 'N-ATLAS did not accept its configured credentials.',
    });
  });
});
