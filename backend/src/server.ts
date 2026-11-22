import { createApp } from './app.ts';
import { logger } from './lib/logger.ts';
import { loadConfig } from './config/env.ts';

try {
  const config = loadConfig();
  const server = createApp(config).listen(config.PORT, config.HOST, () => {
    logger.info({ event: 'server_started', host: config.HOST, port: config.PORT, environment: config.NODE_ENV });
  });
  server.on('error', error => {
    logger.error({ event: 'server_error', message: error.message });
    process.exitCode = 1;
  });
  let stopping = false;
  const shutdown = (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info({ event: 'server_stopping', signal });
    const timeout = setTimeout(() => {
      server.closeAllConnections();
      process.exit(1);
    }, 10_000);
    timeout.unref();
    server.close(error => {
      clearTimeout(timeout);
      process.exitCode = error ? 1 : 0;
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  logger.error({ event: 'startup_failed', message: error instanceof Error ? error.message : 'Startup failed' });
  process.exitCode = 1;
}
