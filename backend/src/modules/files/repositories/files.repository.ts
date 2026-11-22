import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../../database/schema.ts';
import { privateFiles } from '../../../database/schema.ts';
import type { FilesRepository } from '../../../types/files.ts';
import { HttpError } from '../../../lib/http-error.ts';
import { validateFileContent } from '../services/file-validation.ts';

export function createFilesRepository(db: NodePgDatabase<typeof schema>): FilesRepository {
  return {
    async upload(ownerId, data) {
      const bytes = validateFileContent(data);
      return db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ownerId}))`);
        const [usage] = await tx.select({ total: sql<number>`coalesce(sum(${privateFiles.size}),0)` }).from(privateFiles).where(eq(privateFiles.ownerId, ownerId));
        if (Number(usage?.total ?? 0) + bytes.length > 20 * 1024 * 1024) throw new HttpError(413, 'STORAGE_LIMIT', 'The account attachment limit is 20 MB. Contact the administrator.');
        const [file] = await tx.insert(privateFiles).values({ ...data, ownerId, size: bytes.length }).returning({ id: privateFiles.id, name: privateFiles.name, size: privateFiles.size });
        if (!file) throw new Error('Upload failed');
        return file;
      });
    },
    async requireOwnedLink(link, ownerId) {
      const id = link.replace('campus-file:', '');
      const [file] = await db.select({ id: privateFiles.id }).from(privateFiles).where(and(eq(privateFiles.id, id), eq(privateFiles.ownerId, ownerId)));
      if (!file) throw new HttpError(403, 'FILE_FORBIDDEN', 'Choose a file uploaded by your account');
    },
    async get(id, actor) {
      const [file] = await db.select().from(privateFiles).where(eq(privateFiles.id, id));
      if (!file) throw new HttpError(404, 'NOT_FOUND', 'File not found');
      if (file.ownerId !== actor.id && !actor.roles.some(role => role.role === 'administrator' && role.scopeType === 'global')) {
        const link = `campus-file:${id}`;
        const allowed = await db.execute(sql`select 1 from document_requests d where d.issued_file_url=${link} and d.user_id=${actor.id} and d.status='issued'
          union all select 1 from submissions s join assignments a on a.id=s.assignment_id join teaching_assignments t on t.section_id=a.section_id where s.file_url=${link} and t.faculty_id=${actor.id} limit 1`);
        if (!allowed.rows.length) throw new HttpError(403, 'FILE_FORBIDDEN', 'This file is private');
      }
      return file;
    },
  };
}
