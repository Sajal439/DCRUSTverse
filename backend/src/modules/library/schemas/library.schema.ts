import { z } from 'zod';

export const createTitleSchema = z.object({
  isbn: z.string().trim().min(5).max(30),
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
  totalCopies: z.number().int().min(1).max(100).default(1),
});

export const addCopySchema = z.object({
  barcode: z.string().trim().min(3).max(50),
});

export const issueBookSchema = z.object({
  copyId: z.uuid(),
  userId: z.uuid(),
  days: z.number().int().min(1).max(90).default(14),
});

export const returnBookSchema = z.object({
  copyId: z.uuid(),
});
