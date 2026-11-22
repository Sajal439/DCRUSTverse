import { z } from 'zod';

export const createLostFoundItemSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(5).max(1000),
  category: z.string().trim().min(2).max(50),
  locationFound: z.string().trim().min(2).max(100),
});

export const submitClaimSchema = z.object({
  proofDescription: z.string().trim().min(10).max(1000),
});

export const reviewClaimSchema = z.object({
  status: z.enum(['verified', 'rejected']),
});
