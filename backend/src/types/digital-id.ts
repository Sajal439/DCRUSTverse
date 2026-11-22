export interface DigitalIdCard {
  userId: string;
  fullName: string;
  email: string;
  rollNumber?: string | null;
  departmentName?: string | null;
  roles: string[];
  credentialNumber: string;
  barcode: string;
  verificationToken: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
  issuedAt: string;
}

export interface VerificationResult {
  valid: boolean;
  status: 'active' | 'revoked' | 'expired';
  userId?: string;
  fullName?: string;
  departmentName?: string;
  message?: string;
}

export interface DigitalIdRepository {
  issueCredential(userId: string, ttlSeconds?: number): Promise<DigitalIdCard>;
  getCredentialForUser(userId: string): Promise<DigitalIdCard | null>;
  verifyToken(token: string): Promise<VerificationResult>;
  revokeCredential(userId: string): Promise<boolean>;
}
