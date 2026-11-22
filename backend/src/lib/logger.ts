import type { Logger } from '../types/logger.ts';

export const logger: Logger = {
  info: record => console.log(JSON.stringify(record)),
  error: record => console.error(JSON.stringify(record)),
};
