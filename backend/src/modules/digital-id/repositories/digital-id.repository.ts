import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import type * as schema from '../../../database/schema.ts';
import { digitalCredentials, users, profiles, departments } from '../../../database/schema.ts';

import type {
  DigitalIdCard,
  VerificationResult,
  DigitalIdRepository,
} from '../../../types/digital-id.ts';

export type {
  DigitalIdCard,
  VerificationResult,
  DigitalIdRepository,
};

export function createDrizzleDigitalIdRepository(db: NodePgDatabase<typeof schema>): DigitalIdRepository {
  return {
    async issueCredential(userId, ttlSeconds = 300) {
      await db
        .update(digitalCredentials)
        .set({ status: 'revoked' })
        .where(and(eq(digitalCredentials.userId, userId), eq(digitalCredentials.status, 'active')));

      const verificationToken = randomBytes(24).toString('hex');
      const credentialNumber = `DCRUST-ID-${Math.floor(100000 + Math.random() * 900000)}`;
      const barcode = `BAR-${randomBytes(8).toString('hex').toUpperCase()}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      const [cred] = await db
        .insert(digitalCredentials)
        .values({
          userId,
          credentialNumber,
          barcode,
          verificationToken,
          expiresAt,
          status: 'active',
          issuedAt: now,
        })
        .onConflictDoUpdate({
          target: digitalCredentials.userId,
          set: {
            credentialNumber,
            barcode,
            verificationToken,
            expiresAt,
            status: 'active',
            issuedAt: now,
          },
        })
        .returning();

      if (!cred) throw new Error('Failed to issue credential');

      const card = await this.getCredentialForUser(userId);
      if (!card) throw new Error('Failed to load card');
      return card;
    },
    async getCredentialForUser(userId) {
      const [cred] = await db
        .select()
        .from(digitalCredentials)
        .where(eq(digitalCredentials.userId, userId))
        .orderBy(sql`${digitalCredentials.issuedAt} DESC`)
        .limit(1);

      if (!cred) return null;

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

      let departmentName = null;
      if (user?.departmentId) {
        const [dept] = await db.select().from(departments).where(eq(departments.id, user.departmentId)).limit(1);
        departmentName = dept?.name ?? null;
      }

      const isExpired = new Date() > cred.expiresAt;
      const effectiveStatus: 'active' | 'revoked' | 'expired' =
        cred.status === 'revoked' ? 'revoked' : isExpired ? 'expired' : 'active';

      return {
        userId,
        fullName: user?.displayName ?? 'Unknown',
        email: user?.email ?? '',
        rollNumber: profile?.rollNumber ?? null,
        departmentName,
        roles: [],
        credentialNumber: cred.credentialNumber,
        barcode: cred.barcode,
        verificationToken: cred.verificationToken,
        expiresAt: cred.expiresAt.toISOString(),
        status: effectiveStatus,
        issuedAt: cred.issuedAt.toISOString(),
      };
    },
    async verifyToken(token) {
      const [cred] = await db
        .select()
        .from(digitalCredentials)
        .where(eq(digitalCredentials.verificationToken, token))
        .limit(1);

      if (!cred) {
        return { valid: false, status: 'revoked', message: 'Credential token not recognized' };
      }

      if (cred.status === 'revoked') {
        return { valid: false, status: 'revoked', message: 'Credential has been revoked' };
      }

      if (new Date() > cred.expiresAt) {
        return { valid: false, status: 'expired', message: 'Credential verification token has expired' };
      }

      const [user] = await db.select().from(users).where(eq(users.id, cred.userId)).limit(1);
      let departmentName = undefined;
      if (user?.departmentId) {
        const [dept] = await db.select().from(departments).where(eq(departments.id, user.departmentId)).limit(1);
        departmentName = dept?.name;
      }

      return {
        valid: true,
        status: 'active',
        userId: cred.userId,
        fullName: user?.displayName ?? 'Campus User',
        departmentName,
      };
    },
    async revokeCredential(userId) {
      const rows = await db
        .update(digitalCredentials)
        .set({ status: 'revoked' })
        .where(and(eq(digitalCredentials.userId, userId), eq(digitalCredentials.status, 'active')))
        .returning();
      return rows.length > 0;
    },
  };
}
