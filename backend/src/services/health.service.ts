export function getHealth() {
  return { status: 'ok', service: 'dcrustverse-api', timestamp: new Date().toISOString() };
}
