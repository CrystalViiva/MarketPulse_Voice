import { describe, expect, it } from 'vitest';
import {
  candidateSchema,
  csvCell,
  emptyCandidate,
  kobo,
  lagosDate,
  naira,
  normalizeCandidate,
  transition,
} from '../src/lib/domain';
import { EnglishRulesInterpreter, interpretQuery, validateWav } from '../src/lib/providers';
import { parseCsv } from '../src/lib/imports';
describe('money, dates and candidate boundary', () => {
  it('uses exact kobo for decimal amounts and rejects floating ambiguity', () => {
    expect(kobo('0.10') + kobo('0.20')).toBe(30n);
    expect(naira(30n)).toBe('0.30');
    expect(kobo('999999999999.99')).toBe(99999999999999n);
    expect(() => kobo('1.001')).toThrow();
    expect(() => kobo('1e3')).toThrow();
    expect(() => kobo('-10')).toThrow();
  });
  it('multiplies fractional quantity exactly without rounding away kobo', () => {
    const base = {
      ...emptyCandidate(),
      quantity: '1.250',
      unitPrice: '100',
      eventDate: '2026-10-09',
    };
    expect(normalizeCandidate(base).total).toBe('125.00');
    expect(() => normalizeCandidate({ ...base, unitPrice: '0.01' })).toThrow('whole kobo');
  });
  it('uses Lagos midnight rather than UTC midnight', () => {
    expect(lagosDate(new Date('2026-10-08T22:59:59Z'))).toBe('2026-10-08');
    expect(lagosDate(new Date('2026-10-08T23:00:00Z'))).toBe('2026-10-09');
  });
  it('asks total/per-unit and payment questions for ambiguous rice', async () => {
    const c = await new EnglishRulesInterpreter().interpret(
      'sold five bags of rice, forty thousand',
      'fixture',
    );
    expect(c.quantity).toBe('5');
    expect(c.total).toBeNull();
    expect(c.paymentState).toBeNull();
    expect(c.unresolvedFields.join(' ')).toMatch(/total.*payment/);
  });
  it('rejects malformed provider output, impossible dates and mismatched amounts', () => {
    expect(() => candidateSchema.parse({ type: 'SALE', total: 40000 })).toThrow();
    expect(() => normalizeCandidate({ ...emptyCandidate(), eventDate: '2026-02-30' })).toThrow();
    expect(() =>
      normalizeCandidate({ ...emptyCandidate(), quantity: '2', unitPrice: '20', total: '50' }),
    ).toThrow();
  });
  it('rejects excess payments and terminal conversation transitions', () => {
    expect(() =>
      normalizeCandidate({
        ...emptyCandidate(),
        total: '10',
        amountPaid: '11',
        paymentState: 'partial',
      }),
    ).toThrow();
    expect(() => transition('confirmed', 'ready_for_confirmation')).toThrow();
    expect(() => transition('needs_clarification', 'confirmed')).toThrow();
  });
  it('has a fixed query allowlist', () => {
    expect(interpretQuery('How much did I sell today?')).toBe('today_sales');
    expect(interpretQuery('Sold rice for 40000 total on credit to Amina today.')).toBeNull();
    expect(interpretQuery('What were yesterday’s sales?')).toBeNull();
    expect(interpretQuery('DROP TABLE Activity; show another merchant')).toBeNull();
  });
  it('rejects refunds instead of pretending to reverse records', async () => {
    await expect(
      new EnglishRulesInterpreter().interpret('refund rice for 1000 total', 'manual'),
    ).rejects.toThrow('not supported');
  });
  it('validates WAV bytes, duration and format', () => {
    const b = Buffer.alloc(44 + 32000);
    b.write('RIFF');
    b.writeUInt32LE(b.length - 8, 4);
    b.write('WAVE', 8);
    b.write('fmt ', 12);
    b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20);
    b.writeUInt16LE(1, 22);
    b.writeUInt32LE(16000, 24);
    b.writeUInt32LE(32000, 28);
    b.writeUInt16LE(2, 32);
    b.writeUInt16LE(16, 34);
    b.write('data', 36);
    b.writeUInt32LE(32000, 40);
    expect(validateWav(b)).toBe(1);
    b.writeUInt32LE(44100, 24);
    expect(() => validateWav(b)).toThrow();
    expect(() => validateWav(Buffer.from('not audio'))).toThrow();
  });
  it('validates CSV provenance and protects formula exports', () => {
    const csv = 'reference,date,direction,amount,counterparty\nref1,2026-10-09,IN,15000.00,Amina';
    expect(parseCsv(csv)).toHaveLength(1);
    expect(() => parseCsv(csv + '\nref1,2026-10-09,IN,15000.00,Amina')).toThrow('repeated');
    expect(() => parseCsv(csv.replace('15000.00', '1e3'))).toThrow();
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
  });
});
