import type { AuthIdentity, CampusUser } from './auth.ts';

declare global {
  namespace Express {
    interface Locals {
      identity?: AuthIdentity;
      campusUser?: CampusUser;
      requestId: string;
    }
  }
}
export {};
