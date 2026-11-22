import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { AiAssistantRepository } from '../repositories/ai.repository.ts';
import { askAiAssistantSchema } from '../schemas/ai.schema.ts';

export function askAssistant(repo: AiAssistantRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    const actorRoles = actor?.roles.map((r: { role: string }) => r.role) ?? [];
    const actorId = actor?.id ?? 'anonymous';

    const parsed = askAiAssistantSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid query');
    }

    const response = await repo.answerQuery(parsed.data.query, actorRoles, actorId);
    res.json({ data: response });
  };
}
