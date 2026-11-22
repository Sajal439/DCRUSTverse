export interface AuditLogItem {
  id: string;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditRepository {
  listAuditEvents(filters?: {
    actorId?: string;
    targetType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: AuditLogItem[]; total: number }>;
}
