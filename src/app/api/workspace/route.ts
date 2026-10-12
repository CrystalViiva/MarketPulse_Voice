import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { actor, failure, response, scope } from '@/lib/security';
import { report } from '@/lib/reports';
import { lagosDate } from '@/lib/domain';
import { hasNatlasCredentials } from '@/lib/natlas';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const user = await actor(request);
    const membership = await db.membership.findUnique({
      where: { userId: user.id },
      include: { business: true },
    });
    if (!membership) return response({ user: { name: user.name }, business: null });
    const s = await scope(request);
    const today = lagosDate();
    const from = request.nextUrl.searchParams.get('from') ?? today;
    const to = request.nextUrl.searchParams.get('to') ?? today;
    const [
      summary,
      drafts,
      activities,
      settlements,
      allocations,
      imports,
      matches,
      audit,
      shares,
      evidence,
      validations,
    ] = await Promise.all([
      report(s.businessId, from, to),
      db.draft.findMany({
        where: {
          businessId: s.businessId,
          state: { in: ['needs_clarification', 'ready_for_confirmation'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 30,
      }),
      db.activity.findMany({ where: { businessId: s.businessId }, orderBy: { createdAt: 'desc' } }),
      db.settlement.findMany({
        where: { businessId: s.businessId },
        orderBy: { createdAt: 'desc' },
      }),
      db.allocation.findMany({ where: { businessId: s.businessId, voidedAt: null } }),
      db.importedPayment.findMany({
        where: { businessId: s.businessId },
        orderBy: { createdAt: 'desc' },
      }),
      db.match.findMany({ where: { businessId: s.businessId } }),
      db.auditEvent.findMany({
        where: { businessId: s.businessId },
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
      db.reportShare.findMany({
        where: { businessId: s.businessId },
        select: { id: true, createdAt: true, expiresAt: true, revokedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.evidence.findMany({
        where: { businessId: s.businessId },
        select: { id: true, activityId: true, mime: true, createdAt: true },
      }),
      db.validationSession.findMany({
        where: { businessId: s.businessId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return response({
      user: { name: user.name },
      business: membership.business,
      summary,
      drafts,
      activities,
      settlements,
      allocations,
      imports,
      matches,
      audit,
      shares,
      evidence,
      validations,
      capabilities: {
        liveAsr: hasNatlasCredentials(),
        fixture:
          process.env.TRANSCRIPTION_MODE === 'fixture' && membership.business.mode === 'demo',
        interpretation: 'N-ATLAS suggestions when configured; merchant review required',
        speech: 'Read-back text; voice controls and speech output unavailable',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
