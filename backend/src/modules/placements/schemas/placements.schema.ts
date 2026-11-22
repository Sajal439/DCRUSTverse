import { z } from 'zod';

export const createOpportunitySchema = z.object({
  companyName: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(5).max(3000),
  minCgpa: z.number().min(0).max(1000),
  eligibleBranches: z.array(z.string().trim()).min(1),
  deadline: z.string().datetime({ offset: true }),
  packageDetails: z.string().trim().max(200).optional(),
});

export const applyOpportunitySchema = z.object({
  cgpa: z.number().min(0).max(1000),
  branch: z.string().trim().min(1),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['applied', 'shortlisted', 'selected', 'rejected']),
});
