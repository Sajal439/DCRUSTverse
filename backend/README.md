# DCRUSTVerse backend

Express and TypeScript API using Supabase Auth and Supabase PostgreSQL through Drizzle ORM.

## Runtime and commands

Node 26.13.1 is pinned in the repository. On Windows, a checksum-verified local copy is available under `.tools/`. From the repository root, use the helper to select it for each command.

```powershell
.\backend\run.ps1 dev
.\backend\run.ps1 build
.\backend\run.ps1 typecheck
```

On a machine with the pinned Node version installed, run `npm ci` from `backend/`, then use the corresponding `npm run` commands. `npm start` runs the compiled server after a build.

The build compiles application code. Type checking also checks test files. Tests are written for manual execution with `npm test` and have not been run for this stage.

## Environment

Copy `.env.example` to `.env` in this directory and set values from the same Supabase project.

| Setting | Purpose |
|---|---|
| SUPABASE_URL | Supabase project HTTPS origin |
| SUPABASE_PUBLISHABLE_KEY | Public project key used to verify access tokens |
| DATABASE_URL | PostgreSQL connection for the backend |
| DATABASE_MIGRATION_URL | Optional separate direct or session connection for migrations |
| DATABASE_POOL_SIZE | Maximum API database connections, default 10 |
| CORS_ORIGIN | Exact frontend origin without a trailing slash |
| HOST / PORT | Bind address and port, defaults 127.0.0.1 and 4000 |

Keep database passwords in the ignored environment file. Use certificate-verified TLS for remote PostgreSQL connections. Migration accounts need schema creation privileges. Select the application database role deliberately when adding authorization and data-access policies.

Both Supabase settings must be configured together. No external project has been provisioned or connected by this implementation.

## API

| Method | Endpoint | Behavior |
|---|---|---|
| GET | /api/v1/health | Process liveness, HTTP 200 |
| GET | /api/v1/ready | Checks connectivity and complete Drizzle migration history, HTTP 200 or 503 |
| GET | /api/v1/auth/me | Verifies a Supabase access token and returns its user ID and email |

Send `Authorization: Bearer <access_token>` to the identity endpoint. The backend calls Supabase `auth.getUser(token)`, requiring a confirmed, non-anonymous email account. Missing or invalid tokens return 401, unverified accounts return 403, and unavailable authentication returns 503. Provider errors are excluded from responses.

The future frontend uses Supabase Auth for signup, login, recovery, refresh and logout. The identity endpoint establishes identity only. Campus account approval and scoped permissions will be implemented before exposing academic and administrative workflows. JWT validity can outlast logout until token expiry, so access-token lifetime and application account-status checks must be included in that work.

Responses include `X-Request-ID`. Errors use `{ error: { code, message, requestId } }`. JSON requests are limited to 100 KB. Request logs exclude authorization headers, query strings and bodies.

## Database and migrations

The schema source is `src/database/schema.ts`. Application profiles have a unique `auth_user_id` linking to Supabase identity, and a pending/active/disabled campus status. Passwords are managed by Supabase Auth.

```powershell
.\run.ps1 db:generate
.\run.ps1 db:migrate
```

Review generated SQL before applying it. Drizzle owns migration history. The runner serializes migration processes using a session advisory lock and checks history hashes before applying pending migrations. Use a direct or session connection for migration locking. API traffic can use a suitable pooled connection.

Compiled deployments include `dist/` and `drizzle/`, and run `npm run db:migrate:prod`. Preserve LF line endings in migration SQL so checksums stay consistent.

The initial migration enables RLS on application tables. Direct anonymous/authenticated Supabase Data API access has no policies yet, so access is denied. Server repositories will enforce campus permissions and use a deliberately configured database role. A role that bypasses RLS requires explicit server authorization.

A SQL trigger maintains user update timestamps. Treat this custom SQL as part of the migration history alongside generated constraints.

## Tests and verification

`test/auth.test.ts` covers authentication headers, identity responses, invalid tokens, unconfigured authentication, unverified users and provider outages. Other files cover application middleware, configuration and migration constraints.

The database integration test is opt-in via `TEST_DATABASE_URL` and applies migrations to a dedicated disposable database. Its sample rows and history edits are rolled back, while the schema remains installed. Use an account with migration and test-data privileges.

Build, type checking and migration generation can run without live Supabase credentials. Live login and PostgreSQL verification remain pending configuration.

## References

- [Supabase user verification](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
- [Supabase PostgreSQL connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
