import type { CampusUser } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../../types/user-repository.ts';
export async function canReviewDocument(actor: CampusUser, ownerId: string, users?: CampusUserRepository): Promise<boolean> {
  if (actor.roles.some(role => ['administrator', 'service_staff'].includes(role.role) && role.scopeType === 'global')) return true;
  if (!users) return false;
  const owner = await users.findById(ownerId);
  return !!owner?.departmentId && actor.roles.some(role => role.role === 'department_head' && role.scopeType === 'department' && role.scopeId === owner.departmentId);
}
