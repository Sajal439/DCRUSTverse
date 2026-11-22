import { HttpError } from '../../../lib/http-error.ts';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { surveys, surveyQuestions, surveyResponses, surveyParticipations } from '../../../database/schema.ts';

import type {
  SurveyQuestionItem,
  SurveyItem,
  SurveyResponseItem,
  SurveyAggregation,
  SurveysRepository,
} from '../../../types/surveys.ts';

export type {
  SurveyQuestionItem,
  SurveyItem,
  SurveyResponseItem,
  SurveyAggregation,
  SurveysRepository,
};

export function createDrizzleSurveysRepository(db: NodePgDatabase<typeof schema>): SurveysRepository {
  return {
    async listSurveys() {
      const rows = await db.select().from(surveys);
      return rows.map(r => ({
        ...r,
        targetRoles: (r.targetRoles as string[]) ?? [],
        startsAt: r.startsAt.toISOString(),
        endsAt: r.endsAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }));
    },
    async getSurveyById(id) {
      const [survey] = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
      if (!survey) return null;
      const qRows = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, id));

      return {
        ...survey,
        targetRoles: (survey.targetRoles as string[]) ?? [],
        startsAt: survey.startsAt.toISOString(),
        endsAt: survey.endsAt.toISOString(),
        createdAt: survey.createdAt.toISOString(),
        questions: qRows.map(q => ({
          ...q,
          questionType: q.questionType as 'multiple_choice' | 'text',
          options: (q.options as string[]) ?? [],
          createdAt: q.createdAt.toISOString(),
        })),
      };
    },
    async createSurvey(data) {
      const [survey] = await db
        .insert(surveys)
        .values({
          title: data.title.trim(),
          description: data.description?.trim(),
          isAnonymous: data.isAnonymous,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          maxResponses: data.maxResponses ?? 1000,
          targetRoles: data.targetRoles ?? [],
          createdBy: data.createdBy,
        })
        .returning();

      if (!survey) throw new Error('Failed to create survey');

      const questionsToInsert = data.questions.map(q => ({
        surveyId: survey.id,
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        options: q.options ?? [],
      }));

      const qRows = await db.insert(surveyQuestions).values(questionsToInsert).returning();

      return {
        ...survey,
        targetRoles: (survey.targetRoles as string[]) ?? [],
        startsAt: survey.startsAt.toISOString(),
        endsAt: survey.endsAt.toISOString(),
        createdAt: survey.createdAt.toISOString(),
        questions: qRows.map(q => ({
          ...q,
          questionType: q.questionType as 'multiple_choice' | 'text',
          options: (q.options as string[]) ?? [],
          createdAt: q.createdAt.toISOString(),
        })),
      };
    },
    async submitResponses(data) {
      const { surveyId, respondentId, isAnonymous, answers } = data;
      const rowsToInsert = answers.map(a => ({
        surveyId,
        questionId: a.questionId,
        respondentId: isAnonymous ? null : respondentId,
        responseText: a.responseText,
      }));

      const inserted = await db.transaction(async tx => {
        const [survey] = await tx.select().from(surveys).where(eq(surveys.id, surveyId)).for('update');
        if (!survey || new Date() < survey.startsAt || new Date() > survey.endsAt) throw new HttpError(400, 'SURVEY_CLOSED', 'Survey is closed');
        const [existing] = await tx.select().from(surveyParticipations).where(and(eq(surveyParticipations.surveyId, surveyId), eq(surveyParticipations.userId, respondentId)));
        const [legacy] = await tx.select({ id: surveyResponses.id }).from(surveyResponses).where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.respondentId, respondentId))).limit(1);
        if (existing || legacy) throw new HttpError(409, 'ALREADY_RESPONDED', 'You have already answered this survey');
        const [count] = await tx.select({ total: sql<number>`count(*)` }).from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
        if (Number(count?.total ?? 0) / answers.length >= survey.maxResponses) throw new HttpError(409, 'SURVEY_FULL', 'This survey has reached its response limit');
        await tx.insert(surveyParticipations).values({ surveyId, userId: respondentId });
        return tx.insert(surveyResponses).values(rowsToInsert).returning();
      });
      return inserted.map(r => ({
        ...r,
        submittedAt: r.submittedAt.toISOString(),
      }));
    },
    async getAggregation(surveyId) {
      const qRows = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, surveyId));

      const rRows = await db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId));

      const questionResults = qRows.map(q => {
        const answersForQ = rRows.filter(r => r.questionId === q.id);
        const answerCounts: Record<string, number> = {};
        const textAnswers: string[] = [];

        for (const ans of answersForQ) {
          answerCounts[ans.responseText] = (answerCounts[ans.responseText] ?? 0) + 1;
          if (q.questionType === 'text') {
            textAnswers.push(ans.responseText);
          }
        }

        return {
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          answerCounts,
          textAnswers: q.questionType === 'text' ? textAnswers : undefined,
        };
      });

      return {
        surveyId,
        totalResponses: rRows.length > 0 && qRows.length > 0 ? Math.floor(rRows.length / qRows.length) : 0,
        questionResults,
      };
    },
  };
}
