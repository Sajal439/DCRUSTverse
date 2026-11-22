import type { CampusUser } from './auth.ts';
export interface FileUpload { name: string; mimeType: string; contentBase64: string }
export interface PrivateFile extends FileUpload { id: string; ownerId: string; size: number }
export interface FilesRepository {
  upload(ownerId: string, data: FileUpload): Promise<{ id: string; name: string; size: number }>;
  get(id: string, actor: CampusUser): Promise<PrivateFile>;
  requireOwnedLink(link: string, ownerId: string): Promise<void>;
}
