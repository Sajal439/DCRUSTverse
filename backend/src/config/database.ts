import { Pool } from 'pg';
import type { Config } from '../types/config.ts';
import type { Database } from '../types/database.ts';
import type { Logger } from '../types/logger.ts';

export function createDatabase(config: Config, log: Logger): Database | undefined {
  if (!config.DATABASE_URL) return undefined;
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: config.DATABASE_POOL_SIZE,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    application_name: 'dcrustverse-api',
  });
  pool.on('error', () => {
    log.error({ event: 'database_connection_error' });
  });
  return { pool, close: () => pool.end() };
}
