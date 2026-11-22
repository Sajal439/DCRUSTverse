import type { RequestHandler, ErrorRequestHandler } from 'express';
import type { Logger } from '../types/logger.ts';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found', requestId: res.locals.requestId } });
};

const encodingError = { status: 415, code: 'UNSUPPORTED_ENCODING', message: 'Unsupported request encoding' };
const bodyErrors = new Map([
  ['entity.parse.failed', { status: 400, code: 'INVALID_JSON', message: 'Request body must be valid JSON' }],
  ['entity.too.large', { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 100 KB' }],
  ['encoding.unsupported', encodingError],
  ['charset.unsupported', encodingError],
]);

export function handleErrors(log: Logger): ErrorRequestHandler {
  return (error: unknown, _req, res, next) => {
    if (res.headersSent) return next(error);
    const type = error && typeof error === 'object' && 'type' in error ? error.type : undefined;
    const known = typeof type === 'string' ? bodyErrors.get(type) : undefined;
    const requestId = res.locals.requestId;
    if (!known) log.error({ event: 'request_error', requestId, code: 'INTERNAL_ERROR' });
    const { status, code, message } = known ?? {
      status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred',
    };
    res.status(status).json({ error: { code, message, requestId } });
  };
}
