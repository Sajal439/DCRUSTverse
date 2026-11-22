import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { FilesRepository } from '../../../types/files.ts';
import { HttpError } from '../../../lib/http-error.ts';
import { uploadSchema } from '../schemas/files.schema.ts';
export function uploadFile(repo: FilesRepository): RequestHandler {
  return async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'INVALID_FILE', parsed.error.issues[0]?.message ?? 'Invalid upload');
    const file = await repo.upload(res.locals.campusUser!.id, parsed.data);
    res.status(201).json({ data: { ...file, fileUrl: `campus-file:${file.id}` } });
  };
}
export function downloadFile(repo: FilesRepository): RequestHandler {
  return async (req, res) => {
    const id = z.uuid().safeParse(req.params.id);
    if (!id.success) throw new HttpError(400, 'INVALID_INPUT', 'Invalid file');
    const file = await repo.get(id.data, res.locals.campusUser!);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: { name: file.name, mimeType: file.mimeType, contentBase64: file.contentBase64 } });
  };
}
export function requireOwnedAttachment(repo: FilesRepository, field: string): RequestHandler {
  return async (req, res, next) => {
    const value = req.body?.[field];
    if (typeof value === 'string' && value.startsWith('campus-file:')) {
      if (!z.uuid().safeParse(value.slice(12)).success) throw new HttpError(400, 'INVALID_FILE', 'Invalid attachment');
      await repo.requireOwnedLink(value, res.locals.campusUser!.id);
    }
    next();
  };
}
