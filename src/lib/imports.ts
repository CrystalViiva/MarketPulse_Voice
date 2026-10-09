import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { AppError, dateInput, kobo, moneyInput, lagosDate } from './domain';
import { audit, balance, businessTx, Scope, settle } from './ledger';
const rowSchema = z
  .object({
    reference: z.string().trim().min(1).max(100),
    date: dateInput,
    direction: z.enum(['IN', 'OUT']),
    amount: moneyInput,
    counterparty: z.string().trim().max(80),
  })
  .strict();
export type PaymentRow = z.infer<typeof rowSchema>;
export function parseCsv(csv: string) {
  if (Buffer.byteLength(csv) > 256000) throw new AppError('CSV must be smaller than 256 KB.');
  let raw: unknown[];
  try {
    raw = parse(csv, {
      columns: (headers: string[]) => {
        if (headers.join(',') !== 'reference,date,direction,amount,counterparty')
          throw new Error('Unexpected columns');
        return headers;
      },
      bom: true,
      skip_empty_lines: true,
      trim: true,
      max_record_size: 2048,
    });
  } catch {
    throw new AppError('Invalid CSV. Use the provided five-column template.');
  }
  if (!raw.length || raw.length > 500) throw new AppError('Import between 1 and 500 rows.');
  const seen = new Set<string>();
  return raw.map((r, i) => {
    const parsed = rowSchema.safeParse(r);
    if (!parsed.success)
      throw new AppError(
        `Row ${i + 2}: use reference,date,direction,amount,counterparty. Dates must be YYYY-MM-DD and amounts plain positive naira.`,
      );
    const row = parsed.data;
    if (kobo(row.amount) <= 0n || row.date > lagosDate())
      throw new AppError(`Row ${i + 2}: invalid amount or future date.`);
    if (seen.has(row.reference))
      throw new AppError(`Row ${i + 2}: repeated reference in this file.`);
    seen.add(row.reference);
    return row;
  });
}
export async function previewImport(s: Scope, csv: string) {
  const rows = parseCsv(csv);
  const fingerprint = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  return businessTx(s, async (tx) => {
    const business = await tx.business.findUniqueOrThrow({ where: { id: s.businessId } });
    if (business.mode !== 'demo' && rows.some((r) => r.reference.startsWith('EXAMPLE-')))
      throw new AppError(
        'Example CSV rows are synthetic. Use them only in an isolated demo business.',
      );
    const existing = await tx.importBatch.findUnique({
      where: { businessId_fingerprint: { businessId: s.businessId, fingerprint } },
    });
    const payments = await tx.importedPayment.findMany({
      where: { businessId: s.businessId, reference: { in: rows.map((r) => r.reference) } },
    });
    const preview = rows.map((row) => {
      const previous = payments.find((p) => p.reference === row.reference);
      const conflict =
        previous &&
        (previous.amount !== kobo(row.amount) ||
          previous.eventDate !== row.date ||
          previous.direction !== row.direction ||
          previous.counterparty !== row.counterparty);
      return { ...row, status: conflict ? 'conflict' : previous ? 'duplicate' : 'new' };
    });
    const batch =
      existing ??
      (await tx.importBatch.create({ data: { businessId: s.businessId, fingerprint, rows } }));
    return { id: batch.id, state: batch.state, rows: preview };
  });
}
export async function confirmImport(s: Scope, id: string) {
  return businessTx(s, async (tx) => {
    const batch = await tx.importBatch.findFirst({ where: { id, businessId: s.businessId } });
    if (!batch) throw new AppError('Import not found.', 404);
    if (batch.state === 'confirmed') return { created: 0, duplicateFile: true };
    const rows = z.array(rowSchema).parse(batch.rows);
    let created = 0;
    for (const row of rows) {
      const existing = await tx.importedPayment.findUnique({
        where: { businessId_reference: { businessId: s.businessId, reference: row.reference } },
      });
      if (existing) {
        if (
          existing.amount !== kobo(row.amount) ||
          existing.eventDate !== row.date ||
          existing.direction !== row.direction ||
          existing.counterparty !== row.counterparty
        )
          throw new AppError(
            'A reference already exists with different details. Resolve the conflict before importing.',
            409,
          );
        continue;
      }
      await tx.importedPayment.create({
        data: {
          businessId: s.businessId,
          batchId: id,
          reference: row.reference,
          eventDate: row.date,
          direction: row.direction,
          amount: kobo(row.amount),
          counterparty: row.counterparty,
        },
      });
      created++;
    }
    await tx.importBatch.update({ where: { id }, data: { state: 'confirmed' } });
    await audit(tx, s, id, 'import.confirmed', { created });
    return { created, duplicateFile: false };
  });
}
export async function matchPayment(
  s: Scope,
  args: {
    paymentId: string;
    activityId: string;
    settlementId?: string;
    amount: string;
    method: 'corroborate' | 'settle';
    requestKey: string;
    acknowledgeConflict: boolean;
  },
) {
  const amount = kobo(args.amount);
  return businessTx(s, async (tx) => {
    const old = await tx.match.findUnique({
      where: { businessId_requestKey: { businessId: s.businessId, requestKey: args.requestKey } },
    });
    if (old) return old;
    const p = await tx.importedPayment.findFirst({
      where: { id: args.paymentId, businessId: s.businessId },
    });
    if (!p) throw new AppError('Imported payment not found.', 404);
    const used = await tx.match.aggregate({
      where: { businessId: s.businessId, paymentId: p.id },
      _sum: { amount: true },
    });
    if (amount <= 0n || amount > p.amount - (used._sum.amount ?? 0n))
      throw new AppError('Allocation exceeds the available imported payment.', 409);
    const b = await balance(tx, s.businessId, args.activityId);
    if (p.direction !== (b.activity.type === 'SALE' ? 'IN' : 'OUT'))
      throw new AppError('Payment direction does not match this activity.');
    const conflict =
      (p.counterparty &&
        b.activity.counterparty &&
        p.counterparty.toLowerCase() !== b.activity.counterparty.toLowerCase()) ||
      p.eventDate < b.activity.eventDate;
    if (conflict && !args.acknowledgeConflict)
      throw new AppError('Date or counterparty conflict. Review and explicitly acknowledge it.');
    let settlementId: string;
    if (args.method === 'corroborate') {
      const settlement = await tx.settlement.findFirst({
        where: { id: args.settlementId ?? '', businessId: s.businessId, voidedAt: null },
      });
      const allocation =
        settlement &&
        (await tx.allocation.findFirst({
          where: {
            businessId: s.businessId,
            settlementId: settlement.id,
            activityId: b.activity.id,
            voidedAt: null,
          },
        }));
      if (!settlement || !allocation)
        throw new AppError('Choose an existing receipt allocated to this record.');
      const previous = await tx.match.aggregate({
        where: { businessId: s.businessId, settlementId: settlement.id },
        _sum: { amount: true },
      });
      if (amount > settlement.amount - (previous._sum.amount ?? 0n))
        throw new AppError('This receipt already has matching payment support.', 409);
      if (settlement.eventDate !== p.eventDate && !args.acknowledgeConflict)
        throw new AppError('Payment dates differ. Review and acknowledge the conflict.');
      settlementId = settlement.id;
    } else {
      // Do not allow a new receipt when an uncorroborated existing one might be
      // the same transfer. The merchant must review that conflict explicitly.
      const allocations = await tx.allocation.findMany({
        where: { businessId: s.businessId, activityId: b.activity.id, voidedAt: null },
      });
      const possible = await tx.settlement.findMany({
        where: {
          businessId: s.businessId,
          id: { in: allocations.map((a) => a.settlementId) },
          voidedAt: null,
          eventDate: p.eventDate,
        },
      });
      if (possible.length && !args.acknowledgeConflict)
        throw new AppError(
          'A receipt already exists on this date. Match it, or acknowledge that this is a distinct payment.',
        );
      const settlement = await settle(tx, s, {
        activityId: b.activity.id,
        amount,
        date: p.eventDate,
        source: 'csv',
      });
      settlementId = settlement.id;
    }
    const result = await tx.match.create({
      data: {
        ...s,
        requestKey: args.requestKey,
        paymentId: p.id,
        settlementId,
        activityId: b.activity.id,
        amount,
        method: args.method,
      },
    });
    await audit(tx, s, result.id, 'payment.matched', {
      method: args.method,
      acknowledgedConflict: args.acknowledgeConflict,
    });
    return result;
  });
}
