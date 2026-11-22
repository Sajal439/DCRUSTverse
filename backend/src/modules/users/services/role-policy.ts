import type { CampusUser } from '../../../types/auth.ts';
import { HttpError } from '../../../lib/http-error.ts';

export function isGlobalAdministrator(actor: CampusUser): boolean {
  return actor.roles.some(role => role.role === 'administrator' && role.scopeType === 'global');
}

export function requireDepartmentManager(actor: CampusUser, departmentId: string | null | undefined): void {
  if (isGlobalAdministrator(actor)) return;
  if (!departmentId || !actor.roles.some(role => role.role === 'department_head' && role.scopeType === 'department' && role.scopeId === departmentId)) {
    throw new HttpError(403, 'SCOPE_FORBIDDEN', 'You do not manage this department');
  }
}
