import { z } from 'zod';
import type { Field } from '../types/workspace';

export function fieldSchema(field: Field): z.ZodType {
  let schema: z.ZodType;
  switch (field.kind) {
    case 'number':
      schema = z.preprocess(value => value === '' ? undefined : value, z.coerce.number().min(field.min ?? -Infinity).max(field.max ?? Infinity).transform(value => field.scale ? Math.round(value * field.scale) : value));
      break;
    case 'boolean': schema = z.boolean(); break;
    case 'reference': schema = z.uuid({ error: `Choose ${field.label.toLowerCase()}` }); break;
    case 'select': schema = z.enum(field.options as [string, ...string[]]); break;
    case 'datetime':
      schema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?$/, 'Use YYYY-MM-DDTHH:mm')
        .refine(value => !Number.isNaN(Date.parse(value)), 'Enter a valid date and time')
        .transform(value => new Date(value).toISOString());
      break;
    case 'list': schema = z.string().transform(value => value.split(',').map(x => x.trim()).filter(Boolean)).refine(value => !field.required || value.length > 0, 'Enter at least one value'); break;
    default: schema = z.string().trim().min(field.min ?? (field.required ? 1 : 0)).max(field.max ?? 10000);
  }
  return field.required ? schema : z.preprocess(value => value === '' || value === undefined ? undefined : value, schema.optional());
}

export function formSchema(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map(field => [field.key, fieldSchema(field)]))).superRefine((data, ctx) => {
    for (const [start, end] of [['startTime', 'endTime'], ['startDate', 'endDate'], ['startsAt', 'endsAt']]) {
      if (typeof data[start] === 'string' && typeof data[end] === 'string' && data[start] >= data[end]) {
        ctx.addIssue({ code: 'custom', path: [end], message: 'End must be after start' });
      }
    }
  });
}
