export type IntegrationName = 'erp_attendance' | 'exam_portal' | 'hr_directory';
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface SyncRunRecord {
  id: string;
  integrationName: IntegrationName;
  status: SyncStatus;
  idempotencyKey: string;
  recordsProcessed: number;
  errorLog?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

export interface SyncResult {
  isDuplicate: boolean;
  run: SyncRunRecord;
}

export interface IntegrationsRepository {
  executeSync(data: {
    integrationName: IntegrationName;
    idempotencyKey: string;
    payload: Record<string, any>[];
  }): Promise<SyncResult>;
  listSyncRuns(): Promise<SyncRunRecord[]>;
}
