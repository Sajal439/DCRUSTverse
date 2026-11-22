import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, check, index } from 'drizzle-orm/pg-core';

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('departments_code_check', sql`${table.code} = upper(btrim(${table.code})) AND length(${table.code}) BETWEEN 1 AND 30`),
  check('departments_name_check', sql`length(btrim(${table.name})) BETWEEN 1 AND 200`),
]).enableRLS();

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: uuid('auth_user_id').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }),
  status: text('status', { enum: ['pending', 'active', 'disabled'] }).default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('users_department_idx').on(table.departmentId),
  check('users_email_check', sql`${table.email} = lower(btrim(${table.email})) AND length(${table.email}) BETWEEN 3 AND 254`),
  check('users_name_check', sql`length(btrim(${table.displayName})) BETWEEN 1 AND 200`),
  check('users_status_check', sql`${table.status} IN ('pending', 'active', 'disabled')`),
]).enableRLS();
