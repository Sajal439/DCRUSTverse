import type { Pool } from 'pg';
import { z } from 'zod';

const ticketSchema = z.object({ status: z.enum(['ok', 'error']), id: z.string().optional(), details: z.object({ error: z.string().optional() }).optional() });

export function startPushWorker(pool: Pool): () => void {
  let running = false;
  async function tick() {
    if (running) return; running = true;
    const client = await pool.connect().catch(() => null);
    if (!client) { running = false; return; }
    let locked = false;
    try {
      locked = (await client.query('select pg_try_advisory_lock(742130, 3) as locked')).rows[0]?.locked === true;
      if (!locked) return;
      await client.query(`insert into push_deliveries (device_id, notification_id)
        select d.id, n.id from push_devices d join notifications n on n.user_id=d.user_id join users u on u.id=d.user_id
        where d.enabled and u.status='active' and not n.is_read and n.created_at >= d.created_at
        on conflict (device_id, notification_id) do nothing`);
      const jobs = await client.query(`select p.id, p.ticket_id, p.status, d.device_token, d.id as device_id
        from push_deliveries p join push_devices d on d.id=p.device_id join notifications n on n.id=p.notification_id join users u on u.id=n.user_id
        where d.enabled and d.user_id=n.user_id and u.status='active' and
        ((p.status='pending' and p.attempts<3) or (p.status='accepted' and p.updated_at < now()-interval '30 seconds'))
        order by p.updated_at limit 10`);
      for (const job of jobs.rows) {
        try {
          if (job.status === 'pending') {
            await client.query('update push_deliveries set attempts=attempts+1, updated_at=now() where id=$1', [job.id]);
            // No personal data on the lock screen or in the external push payload.
            const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) }, body: JSON.stringify({ to: job.device_token, title: 'DCRUSTVerse', body: 'You have a new campus update. Open your inbox.', sound: 'default', channelId: 'campus' }), signal: AbortSignal.timeout(8000) });
            if (!response.ok) throw new Error('PUSH_PROVIDER_UNAVAILABLE');
            const result = z.object({ data: ticketSchema }).parse(await response.json()).data;
            await client.query('update push_deliveries set status=$2, ticket_id=$3, error=$4, updated_at=now() where id=$1', [job.id, result.status === 'ok' && result.id ? 'accepted' : 'failed', result.id ?? null, result.details?.error ?? null]);
            if (result.details?.error === 'DeviceNotRegistered') await client.query('update push_devices set enabled=false where id=$1', [job.device_id]);
          } else {
            const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) }, body: JSON.stringify({ ids: [job.ticket_id] }), signal: AbortSignal.timeout(8000) });
            if (!response.ok) throw new Error('PUSH_PROVIDER_UNAVAILABLE');
            const result = z.object({ data: z.record(z.string(), ticketSchema) }).parse(await response.json()).data[job.ticket_id];
            if (result) {
              await client.query('update push_deliveries set status=$2,error=$3,updated_at=now() where id=$1', [job.id, result.status === 'ok' ? 'delivered' : 'failed', result.details?.error ?? null]);
              if (result.details?.error === 'DeviceNotRegistered') await client.query('update push_devices set enabled=false where id=$1', [job.device_id]);
            } else await client.query("update push_deliveries set status='failed',error='RECEIPT_TIMEOUT' where id=$1 and updated_at < now()-interval '24 hours'", [job.id]);
          }
        } catch {
          await client.query("update push_deliveries set error='PROVIDER_REQUEST_FAILED', status=case when attempts>=3 then 'failed' else status end where id=$1", [job.id]);
        }
      }
    } catch { /* Storage may be unavailable; the next interval retries persisted jobs. */ }
    finally { if (locked) await client.query('select pg_advisory_unlock(742130, 3)').catch(() => undefined); client.release(); running = false; }
  }
  const timer = setInterval(() => { void tick(); }, 30000); timer.unref();
  return () => clearInterval(timer);
}
