import type { AuthIdentity } from './auth.ts';

declare global {
  namespace Express {
    interface Locals {
      identity?: AuthIdentity;
      requestId: string;
    }
  }
}
export {};
