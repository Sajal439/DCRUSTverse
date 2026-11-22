export interface Logger {
  info(record: Record<string, unknown>): void;
  error(record: Record<string, unknown>): void;
}
