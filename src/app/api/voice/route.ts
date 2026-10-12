import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { AppError, transition } from '@/lib/domain';
import { checkOrigin, failure, limitedForm, rateLimit, response, scope } from '@/lib/security';
import { interpretDraft } from '@/lib/interpretation';
import { FixtureTranscriber, interpretQuery, validateWav } from '@/lib/providers';
import { NatlasGateway } from '@/lib/natlas';
export async function POST(request: NextRequest) {
  let interactionId: string | undefined;
  const start = Date.now();
  try {
    checkOrigin(request);
    const s = await scope(request);
    await rateLimit('voice:' + s.actorId, 12);
    if (Number(request.headers.get('content-length') ?? 0) > 1100000)
      throw new AppError('Audio is too large.', 413);
    const form = await limitedForm(request, 1100000);
    if (form.get('consent') !== 'true')
      throw new AppError('Consent is required before processing a recording.');
    const key = z.string().min(8).max(100).parse(form.get('requestKey'));
    const mode = form.get('mode');
    const language = z.enum(['en', 'yo', 'ig', 'ha']).parse(form.get('language'));
    const existing = await db.draft.findUnique({
      where: { businessId_requestKey: { businessId: s.businessId, requestKey: key } },
    });
    if (existing) return response({ draft: existing });
    const business = await db.business.findUniqueOrThrow({ where: { id: s.businessId } });
    if (
      mode === 'fixture' &&
      (business.mode !== 'demo' || process.env.TRANSCRIPTION_MODE !== 'fixture')
    )
      throw new AppError(
        'Fixture transcription is only enabled for explicitly selected demo businesses.',
      );
    const file = form.get('audio');
    let audio = Buffer.alloc(0);
    if (file instanceof File) {
      audio = Buffer.from(await file.arrayBuffer());
      validateWav(audio);
    } else if (mode !== 'fixture') throw new AppError('Record or upload audio first.');
    const provider = mode === 'fixture' ? new FixtureTranscriber() : new NatlasGateway();
    const interaction = await db.interaction.create({
      data: {
        businessId: s.businessId,
        state: 'uploaded',
        provider: provider.identity.provider,
        model: provider.identity.model,
        outcome: 'processing',
        latencyMs: 0,
        language,
        consentAt: new Date(),
      },
    });
    interactionId = interaction.id;
    const result = await provider.transcribe(audio, language, String(form.get('fixtureId') ?? ''));
    transition('uploaded', 'transcribed');
    await db.interaction.update({ where: { id: interaction.id }, data: { state: 'transcribed' } });
    const intent = interpretQuery(result.text);
    if (intent) {
      await db.interaction.update({
        where: { id: interaction.id },
        data: { outcome: 'query', latencyMs: Date.now() - start },
      });
      return response({ query: result.text, fixture: mode === 'fixture' });
    }
    transition('transcribed', 'draft');
    const draft = await interpretDraft(
      s,
      result.text,
      mode === 'fixture' ? 'fixture' : 'voice',
      key,
      language,
    );
    await db.interaction.update({
      where: { id: interaction.id },
      data: {
        draftId: draft.id,
        state: draft.state,
        outcome: 'success',
        latencyMs: Date.now() - start,
      },
    });
    return response({ draft });
  } catch (error) {
    if (interactionId)
      await db.interaction.update({
        where: { id: interactionId },
        data: { state: 'failed', outcome: 'failed', latencyMs: Date.now() - start },
      });
    return failure(error);
  }
}
