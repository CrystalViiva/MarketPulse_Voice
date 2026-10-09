import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { csvCell, naira } from '@/lib/domain';
import { failure, scope } from '@/lib/security';
export async function GET(request: NextRequest) {
  try {
    const s = await scope(request);
    const rows = await db.validationSession.findMany({
      where: { businessId: s.businessId },
      orderBy: { createdAt: 'asc' },
    });
    const columns = [
      'participant_id',
      'language',
      'task',
      'timestamp',
      'expected_naira',
      'confirmed_naira',
      'system_result',
      'correction',
      'duration_seconds',
      'outcome',
      'feedback',
      'consented_at',
    ];
    const csv = [
      columns.join(','),
      ...rows.map((r) =>
        [
          r.participantId,
          r.language,
          r.task,
          r.createdAt.toISOString(),
          r.expectedAmount === null ? '' : naira(r.expectedAmount),
          r.confirmedAmount === null ? '' : naira(r.confirmedAmount),
          r.result,
          r.correction,
          r.durationSeconds,
          r.outcome,
          r.feedback,
          r.consentAt.toISOString(),
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\r\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="consented-validation.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
