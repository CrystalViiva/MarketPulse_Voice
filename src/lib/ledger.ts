import { Prisma } from '@prisma/client';
import { db } from './db';
import {
  AppError,
  Candidate,
  candidateSchema,
  jsonSafe,
  kobo,
  normalizeCandidate,
  transition,
} from './domain';
export type Scope = { businessId: string; actorId: string };
export type Tx = Prisma.TransactionClient;
// All financial mutations acquire the same business row lock. This serializes
// confirmation, amendments, import and allocation decisions across workers.
export async function businessTx<T>(scope: Scope, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "Business" WHERE id = ${scope.businessId} FOR UPDATE`;
      if (!rows.length) throw new AppError('Business not found.', 404);
      return fn(tx);
    },
    { timeout: 15000 },
  );
}
export async function audit(
  tx: Tx,
  s: Scope,
  entityId: string,
  action: string,
  details: object = {},
) {
  await tx.auditEvent.create({
    data: { ...s, entityId, action, details: jsonSafe(details) as Prisma.InputJsonValue },
  });
}
export async function createDraft(
  s: Scope,
  raw: unknown,
  requestKey: string,
  transcript?: string,
  correction?: { id: string; reason: string },
) {
  const c = normalizeCandidate(raw);
  return businessTx(s, async (tx) => {
    const existing = await tx.draft.findUnique({
      where: { businessId_requestKey: { businessId: s.businessId, requestKey } },
    });
    if (existing) return existing;
    const business = await tx.business.findUniqueOrThrow({ where: { id: s.businessId } });
    if (c.source === 'fixture' && business.mode !== 'demo')
      throw new AppError('Fixtures are only allowed in an isolated demo business.');
    if (correction) await ensureCorrectable(tx, s, correction.id);
    const state = c.unresolvedFields.length ? 'needs_clarification' : 'ready_for_confirmation';
    transition('draft', state);
    const d = await tx.draft.create({
      data: {
        ...s,
        requestKey,
        state,
        candidate: c,
        source: c.source,
        transcript,
        replacesId: correction?.id,
        correctionReason: correction?.reason,
      },
    });
    await tx.draftVersion.create({
      data: {
        businessId: s.businessId,
        actorId: s.actorId,
        draftId: d.id,
        version: 1,
        candidate: c,
      },
    });
    await audit(tx, s, d.id, 'draft.created', { state });
    return d;
  });
}
export async function reviseDraft(s: Scope, id: string, version: number, raw: unknown) {
  const c = normalizeCandidate(raw);
  return businessTx(s, async (tx) => {
    const d = await tx.draft.findFirst({ where: { id, businessId: s.businessId } });
    if (!d) throw new AppError('Draft not found.', 404);
    if (d.version !== version)
      throw new AppError('This draft changed. Reload and review the latest version.', 409);
    if (c.source !== d.source) throw new AppError('The source of a draft cannot be changed.');
    const state = c.unresolvedFields.length ? 'needs_clarification' : 'ready_for_confirmation';
    transition(d.state, state);
    const next = await tx.draft.update({
      where: { id },
      data: { candidate: c, state, version: { increment: 1 } },
    });
    await tx.interaction.updateMany({
      where: { businessId: s.businessId, draftId: id },
      data: { state },
    });
    await tx.draftVersion.create({
      data: {
        businessId: s.businessId,
        actorId: s.actorId,
        draftId: id,
        version: next.version,
        candidate: c,
      },
    });
    await audit(tx, s, id, 'draft.revised', { version: next.version, state });
    return next;
  });
}
export async function cancelDraft(s: Scope, id: string, version: number) {
  return businessTx(s, async (tx) => {
    const d = await tx.draft.findFirst({ where: { id, businessId: s.businessId } });
    if (!d) throw new AppError('Draft not found.', 404);
    if (d.version !== version) throw new AppError('Draft changed. Reload first.', 409);
    transition(d.state, 'cancelled');
    await tx.draft.update({ where: { id }, data: { state: 'cancelled' } });
    await tx.interaction.updateMany({
      where: { businessId: s.businessId, draftId: id },
      data: { state: 'cancelled' },
    });
    await audit(tx, s, id, 'draft.cancelled');
    return { ok: true };
  });
}
async function ensureCorrectable(tx: Tx, s: Scope, id: string) {
  const a = await tx.activity.findFirst({
    where: { id, businessId: s.businessId, voidedAt: null },
  });
  if (!a) throw new AppError('Original record not found.', 404);
  const allocations = await tx.allocation.findMany({
    where: { businessId: s.businessId, activityId: id, voidedAt: null },
  });
  const settlements = await tx.settlement.findMany({
    where: { businessId: s.businessId, originActivityId: id, voidedAt: null },
  });
  if (
    allocations.some((x) => !settlements.some((y) => y.id === x.settlementId)) ||
    (await tx.match.count({ where: { businessId: s.businessId, activityId: id } }))
  ) {
    throw new AppError(
      'This record has later payments or matched evidence. Correction requires payment review and is blocked in this prototype.',
      409,
    );
  }
  return a;
}
export async function balance(tx: Tx, businessId: string, activityId: string) {
  const a = await tx.activity.findFirst({ where: { id: activityId, businessId, voidedAt: null } });
  if (!a) throw new AppError('Debt not found.', 404);
  const allocations = await tx.allocation.aggregate({
    where: { businessId, activityId, voidedAt: null },
    _sum: { amount: true },
  });
  return { activity: a, remaining: a.amount - (allocations._sum.amount ?? 0n) };
}
export async function settle(
  tx: Tx,
  s: Scope,
  args: {
    activityId: string;
    amount: bigint;
    date: string;
    source: string;
    draftId?: string;
    originActivityId?: string;
  },
) {
  const b = await balance(tx, s.businessId, args.activityId);
  if (args.amount <= 0n || args.amount > b.remaining)
    throw new AppError(
      'Payment exceeds the remaining debt, or the debt has already been paid.',
      409,
    );
  if (args.date < b.activity.eventDate)
    throw new AppError('A payment cannot be dated before its original activity.');
  const payment = await tx.settlement.create({
    data: {
      businessId: s.businessId,
      draftId: args.draftId,
      originActivityId: args.originActivityId,
      direction: b.activity.type === 'SALE' ? 'IN' : 'OUT',
      amount: args.amount,
      eventDate: args.date,
      source: args.source,
      counterparty: b.activity.counterparty,
    },
  });
  await tx.allocation.create({
    data: {
      businessId: s.businessId,
      settlementId: payment.id,
      activityId: args.activityId,
      amount: args.amount,
    },
  });
  return payment;
}
export async function confirmDraft(
  s: Scope,
  id: string,
  version: number,
  explicitConfirmation: boolean,
) {
  if (explicitConfirmation !== true) throw new AppError('Explicit confirmation is required.');
  return businessTx(s, async (tx) => {
    const d = await tx.draft.findFirst({ where: { id, businessId: s.businessId } });
    if (!d) throw new AppError('Draft not found.', 404);
    if (d.version !== version)
      throw new AppError(
        'This draft changed. Read back the latest version before confirming.',
        409,
      );
    if (d.state === 'confirmed') return { id: d.confirmedId, alreadyConfirmed: true };
    transition(d.state, 'confirmed');
    const c = normalizeCandidate(d.candidate);
    if (c.unresolvedFields.length || !c.total || !c.eventDate || !c.type || !c.item)
      throw new AppError('Resolve all questions before confirming.');
    if (d.replacesId) {
      await ensureCorrectable(tx, s, d.replacesId);
      if (c.type === 'COLLECTION' || c.type === 'SUPPLIER_PAYMENT')
        throw new AppError('A correction must remain a business activity.');
      const now = new Date();
      await tx.activity.update({ where: { id: d.replacesId }, data: { voidedAt: now } });
      await tx.settlement.updateMany({
        where: { businessId: s.businessId, originActivityId: d.replacesId },
        data: { voidedAt: now },
      });
      await tx.allocation.updateMany({
        where: { businessId: s.businessId, activityId: d.replacesId },
        data: { voidedAt: now },
      });
      await audit(tx, s, d.replacesId, 'activity.replaced', {
        reason: d.correctionReason,
        replacementDraft: id,
      });
    }
    if (c.counterparty)
      await tx.counterparty.upsert({
        where: { businessId_alias: { businessId: s.businessId, alias: c.counterparty } },
        create: { businessId: s.businessId, alias: c.counterparty },
        update: {},
      });
    let confirmedId: string;
    if (c.type === 'COLLECTION' || c.type === 'SUPPLIER_PAYMENT') {
      const b = await balance(tx, s.businessId, c.debtActivityId!);
      if ((c.type === 'COLLECTION') !== (b.activity.type === 'SALE'))
        throw new AppError('Choose a debt of the correct kind.');
      const payment = await settle(tx, s, {
        activityId: b.activity.id,
        amount: kobo(c.total),
        date: c.eventDate,
        source: c.source,
        draftId: id,
      });
      confirmedId = payment.id;
    } else {
      const a = await tx.activity.create({
        data: {
          businessId: s.businessId,
          draftId: id,
          type: c.type,
          item: c.item,
          quantity: c.quantity,
          unit: c.unit,
          amount: kobo(c.total),
          eventDate: c.eventDate,
          counterparty: c.counterparty,
          source: c.source,
          replacesId: d.replacesId,
        },
      });
      if (c.amountPaid && kobo(c.amountPaid) > 0n)
        await settle(tx, s, {
          activityId: a.id,
          amount: kobo(c.amountPaid),
          date: c.eventDate,
          source: c.source,
          originActivityId: a.id,
        });
      confirmedId = a.id;
    }
    await tx.draft.update({ where: { id }, data: { state: 'confirmed', confirmedId } });
    await tx.interaction.updateMany({
      where: { businessId: s.businessId, draftId: id },
      data: { state: 'confirmed' },
    });
    await audit(tx, s, confirmedId, 'draft.confirmed', { draftId: id, version, source: c.source });
    return { id: confirmedId, alreadyConfirmed: false };
  });
}
export async function correctionDraft(s: Scope, id: string, reason: string, requestKey: string) {
  const activity = await db.activity.findFirst({
    where: { id, businessId: s.businessId, voidedAt: null },
  });
  if (!activity) throw new AppError('Record not found.', 404);
  const original = await db.draft.findFirstOrThrow({
    where: { id: activity.draftId, businessId: s.businessId },
  });
  return createDraft(s, candidateSchema.parse(original.candidate), requestKey, undefined, {
    id,
    reason,
  });
}
export type { Candidate };
