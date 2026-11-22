import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { SurveysRepository } from '../repositories/surveys.repository.ts';
import { createSurveySchema, submitSurveyAnswersSchema } from '../schemas/surveys.schema.ts';

export function listSurveys(repo: SurveysRepository): RequestHandler {
  return async (_req, res) => {
    const actor = res.locals.campusUser;
    const actorRoles = actor?.roles.map((r: { role: string }) => r.role) ?? [];
    const isAdmin = actorRoles.includes('administrator');

    const surveys = await repo.listSurveys();
    const filtered = isAdmin
      ? surveys
      : surveys.filter(s => {
          if (!s.targetRoles || s.targetRoles.length === 0) return true;
          return s.targetRoles.some(r => actorRoles.includes(r));
        });

    res.json({ data: filtered });
  };
}

export function getSurvey(repo: SurveysRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const survey = await repo.getSurveyById(id);
    if (!survey) throw new HttpError(404, 'NOT_FOUND', 'Survey not found');

    res.json({ data: survey });
  };
}

export function createSurvey(repo: SurveysRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createSurveySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid survey data');
    }

    const survey = await repo.createSurvey({
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      createdBy: actor.id,
    });

    res.status(201).json({ data: survey });
  };
}

export function submitAnswers(repo: SurveysRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const survey = await repo.getSurveyById(id);
    if (!survey) throw new HttpError(404, 'NOT_FOUND', 'Survey not found');

    const now = new Date();
    if (now < new Date(survey.startsAt) || now > new Date(survey.endsAt)) {
      throw new HttpError(400, 'SURVEY_CLOSED', 'Survey is currently not accepting responses');
    }

    const parsed = submitSurveyAnswersSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid answers');
    }

    const responses = await repo.submitResponses({
      surveyId: id,
      respondentId: actor.id,
      isAnonymous: survey.isAnonymous,
      answers: parsed.data.answers,
    });

    res.status(201).json({ data: { count: responses.length, submitted: true } });
  };
}

export function getSurveyAggregation(repo: SurveysRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const survey = await repo.getSurveyById(id);
    if (!survey) throw new HttpError(404, 'NOT_FOUND', 'Survey not found');

    const aggregation = await repo.getAggregation(id);
    res.json({ data: aggregation });
  };
}
