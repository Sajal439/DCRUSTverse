import { z } from 'zod';

export const askAiAssistantSchema = z.object({
  query: z.string().trim().min(2).max(1000),
});
