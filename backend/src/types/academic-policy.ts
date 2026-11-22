import type { CampusUser } from './auth.ts';
export interface AcademicPolicy {
  authorize(actor: CampusUser, source: 'section' | 'assignment' | 'submission', id: string, mode: 'read' | 'teach' | 'submit'): Promise<void>;
}
