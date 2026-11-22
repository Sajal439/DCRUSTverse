import { z } from 'zod';

export const createSurveySchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1000).optional(),
  isAnonymous: z.boolean().default(false),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  maxResponses: z.number().int().positive().default(1000),
  targetRoles: z.array(z.string().trim()).default([]),
  questions: z.array(
    z.object({
      questionText: z.string().trim().min(2).max(500),
      questionType: z.enum(['multiple_choice', 'text']),
      options: z.array(z.string().trim()).default([]),
    }),
  ).min(1),
});

export const submitSurveyAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.uuid(),
      responseText: z.string().trim().min(1).max(2000),
    }),
  ).min(1),
});
