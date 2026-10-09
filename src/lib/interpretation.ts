import { db } from './db';
import { Candidate } from './domain';
import { createDraft, Scope } from './ledger';
import { EnglishRulesInterpreter } from './providers';
export async function interpretDraft(
  s: Scope,
  text: string,
  source: Candidate['source'],
  requestKey: string,
) {
  const provider = new EnglishRulesInterpreter();
  const start = Date.now();
  try {
    const candidate = await provider.interpret(text, source);
    const draft = await createDraft(s, candidate, requestKey, text);
    await db.interaction.create({
      data: {
        businessId: s.businessId,
        draftId: draft.id,
        state: draft.state,
        provider: provider.identity.provider,
        model: provider.identity.model,
        outcome: 'success',
        latencyMs: Date.now() - start,
        language: 'en-NG',
      },
    });
    return draft;
  } catch (error) {
    await db.interaction.create({
      data: {
        businessId: s.businessId,
        state: 'failed',
        provider: provider.identity.provider,
        model: provider.identity.model,
        outcome: 'failed',
        latencyMs: Date.now() - start,
        language: 'en-NG',
      },
    });
    throw error;
  }
}
