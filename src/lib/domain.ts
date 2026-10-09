import { z } from 'zod';
export class AppError extends Error {
  constructor(
    public message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const moneyInput = z
  .string()
  .regex(/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/, 'Use naira, up to 2 decimal places, without commas.');
export function kobo(value: string): bigint {
  moneyInput.parse(value);
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
export function naira(value: bigint | string): string {
  const n = BigInt(value);
  const abs = n < 0n ? -n : n;
  return `${n < 0n ? '-' : ''}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`;
}
export function currency(value: bigint | string) {
  const [w, f] = naira(value).split('.');
  return `₦${w.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${f === '00' ? '' : '.' + f}`;
}
export function lagosDate(date = new Date()) {
  return new Date(date.getTime() + 3600000).toISOString().slice(0, 10);
}
export const dateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    'Use a real calendar date.',
  );
export const candidateSchema = z
  .object({
    type: z.enum(['SALE', 'EXPENSE', 'INVENTORY', 'COLLECTION', 'SUPPLIER_PAYMENT']).nullable(),
    item: z.string().trim().max(160).nullable(),
    quantity: z
      .string()
      .regex(/^\d{1,8}(\.\d{1,3})?$/)
      .nullable(),
    unit: z.string().max(30).nullable(),
    unitPrice: moneyInput.nullable(),
    total: moneyInput.nullable(),
    currency: z.literal('NGN'),
    eventDate: dateInput.nullable(),
    counterparty: z.string().trim().max(80).nullable(),
    paymentState: z.enum(['paid', 'unpaid', 'partial']).nullable(),
    amountPaid: moneyInput.nullable(),
    outstandingAmount: moneyInput.nullable(),
    debtActivityId: z.string().max(100).nullable(),
    source: z.enum(['manual', 'voice', 'fixture']),
    unresolvedFields: z.array(z.string().max(100)).max(20),
  })
  .strict();
export type Candidate = z.infer<typeof candidateSchema>;
export const emptyCandidate = (source: Candidate['source'] = 'manual'): Candidate => ({
  type: null,
  item: null,
  quantity: null,
  unit: null,
  unitPrice: null,
  total: null,
  currency: 'NGN',
  eventDate: null,
  counterparty: null,
  paymentState: null,
  amountPaid: null,
  outstandingAmount: null,
  debtActivityId: null,
  source,
  unresolvedFields: [],
});
export function normalizeCandidate(raw: unknown): Candidate {
  const c = candidateSchema.parse(raw);
  const unresolved: string[] = [];
  if (!c.type) unresolved.push('Choose the kind of record.');
  if (!c.item) unresolved.push('What was sold, bought or paid for?');
  if (!c.eventDate) unresolved.push('On which date did this happen?');
  if (c.eventDate && c.eventDate > lagosDate())
    throw new AppError('Future business records are not supported.');
  if (c.quantity && BigInt(c.quantity.replace('.', '')) === 0n)
    throw new AppError('Quantity must be greater than zero.');
  if (c.unitPrice && c.quantity) {
    const [w, f = ''] = c.quantity.split('.');
    const q = BigInt(w + f.padEnd(3, '0'));
    const product = kobo(c.unitPrice) * q;
    if (product % 1000n !== 0n)
      throw new AppError('Quantity × unit price must resolve to whole kobo.');
    const calculated = naira(product / 1000n);
    if (!moneyInput.safeParse(calculated).success)
      throw new AppError('The calculated total exceeds the supported amount range.');
    if (c.total && kobo(c.total) !== kobo(calculated))
      throw new AppError('Total does not equal quantity × unit price.');
    c.total = calculated;
  }
  if (!c.total) unresolved.push('Is the amount the total or the price per unit? Enter the total.');
  else if (kobo(c.total) <= 0n) throw new AppError('Amount must be greater than zero.');
  const settlement = c.type === 'COLLECTION' || c.type === 'SUPPLIER_PAYMENT';
  if (settlement) {
    if (!c.debtActivityId) unresolved.push('Choose the original debt.');
    c.paymentState = 'paid';
    c.amountPaid = c.total;
  } else {
    if (!c.paymentState) unresolved.push('Was payment received or made: paid, unpaid or partial?');
    if (c.paymentState === 'paid') c.amountPaid = c.total;
    if (c.paymentState === 'unpaid') c.amountPaid = '0.00';
    if (c.paymentState === 'partial' && c.amountPaid === null)
      unresolved.push('How much was paid?');
    if (c.paymentState && c.paymentState !== 'paid' && !c.counterparty)
      unresolved.push('Who owes this amount? Enter a customer or supplier alias.');
  }
  if (c.total && c.amountPaid !== null) {
    if (kobo(c.amountPaid) > kobo(c.total))
      throw new AppError('Payment exceeds the total. Excess payments are not supported.');
    if (
      c.paymentState === 'partial' &&
      (kobo(c.amountPaid) === 0n || kobo(c.amountPaid) === kobo(c.total))
    )
      throw new AppError('A partial payment must be between zero and the total.');
    c.outstandingAmount = naira(kobo(c.total) - kobo(c.amountPaid));
  } else c.outstandingAmount = null;
  c.unresolvedFields = unresolved;
  return c;
}
export const allowedTransitions: Record<string, string[]> = {
  uploaded: ['transcribed', 'failed'],
  recorded: ['transcribed', 'failed'],
  transcribed: ['draft', 'failed'],
  draft: ['needs_clarification', 'ready_for_confirmation', 'cancelled', 'failed'],
  needs_clarification: ['needs_clarification', 'ready_for_confirmation', 'cancelled'],
  ready_for_confirmation: [
    'needs_clarification',
    'ready_for_confirmation',
    'confirmed',
    'cancelled',
  ],
  confirmed: [],
  cancelled: [],
  failed: [],
};
export function transition(from: string, to: string) {
  if (!allowedTransitions[from]?.includes(to))
    throw new AppError('This conversation has already ended or cannot make that transition.', 409);
}
export function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)));
}
export function csvCell(value: unknown) {
  const s = String(value ?? '');
  return '"' + (/^\s*[=+@-]|^[\t\r\n]/.test(s) ? "'" : '') + s.replaceAll('"', '""') + '"';
}
