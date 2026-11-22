export interface AuthIdentity {
  id: string;
  email: string;
}
export type VerifyIdentity = (token: string) => Promise<AuthIdentity>;
