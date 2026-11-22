import { loadConfig } from '../config/env.ts';
import { createDatabase } from '../config/database.ts';
import { logger } from '../lib/logger.ts';
import { migrate } from './migrations.ts';

async function main() {
  const database = createDatabase(loadConfig({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL,
  }), logger);
  if (!database) throw new Error('DATABASE_URL is required for migrations');
  try {
    const client = await database.pool.connect();
    try {
      await migrate(client);
      logger.info({ event: 'migrations_applied' });
    } finally {
      client.release();
    }
  } finally {
    await database.close();
  }
}

main().catch(() => {
  logger.error({ event: 'migration_failed', message: 'Check database connectivity, privileges and migration history' });
  process.exitCode = 1;
});
