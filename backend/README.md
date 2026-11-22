# DCRUSTVerse backend

Stage 1 provides an Express API scaffold written in TypeScript. It includes configuration validation, security headers, restricted browser CORS, request IDs, JSON request limits, structured logs, graceful shutdown, and a consistent error envelope.

## Run locally

Requires Node.js 24.x and npm. Run these commands from the `backend` directory:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

The default endpoint is `http://127.0.0.1:4000/api/v1/health`. The development server reloads when source files change. Environment variables override `.env` values. `HOST` defaults to loopback; change it explicitly when deploying in a container. `CORS_ORIGIN` accepts one exact HTTP(S) origin, without a trailing slash. CORS controls browser access and is not authentication.

For a compiled build:

```powershell
npm run build
npm start
```

The build type-checks and compiles the application. The test suite is available for manual execution with `npm test`.

```powershell
npm run typecheck
npm run build
```

## Source layout

Versioned routes in `src/routes/` connect HTTP endpoints to controllers in `src/controllers/`. Controllers format HTTP responses and call services in `src/services/`. Shared request handling lives in `src/middleware/`.

The environment loader in `src/config/` validates settings against the Zod schema in `src/schemas/`. Shared TypeScript contracts live in `src/types/`, including the configuration type inferred from that schema. The HTTP test file lives in `test/`.

Direct dependencies are pinned to the versions resolved from npm's `latest` tag at setup. Commit changes to the manifest and lockfile together when upgrading.

## API contract

`GET /api/v1/health` returns HTTP 200:

```json
{"status":"ok","service":"dcrustverse-api","timestamp":"2026-11-22T00:00:00.000Z"}
```

The timestamp is generated for each request. This endpoint verifies that the API process is responding; it does not claim database or integration readiness. All responses include a generated `X-Request-ID` header.

Errors use this shape:

```json
{"error":{"code":"NOT_FOUND","message":"Endpoint not found","requestId":"generated-uuid"}}
```

| Status | Code | Meaning |
|---|---|---|
| 400 | INVALID_JSON | Malformed JSON request |
| 404 | NOT_FOUND | Unknown endpoint |
| 413 | PAYLOAD_TOO_LARGE | JSON body exceeds 100 KB |
| 415 | UNSUPPORTED_ENCODING | Unsupported JSON charset or encoding |
| 500 | INTERNAL_ERROR | Unexpected server error |

Request logs contain IDs, methods, status codes and elapsed time. Request headers, bodies and URL query strings are excluded. Internal error responses do not expose stack traces. Production HTTPS termination and deployment configuration will be handled separately.

## Next stages

1. Choose and configure the database, migrations and local development service.
2. Implement account provisioning, password handling and sessions.
3. Implement scoped role permissions and permission tests.
4. Add domain modules individually against the acceptance criteria in `PROJECT_REQUIREMENTS.md`.

No database, authentication, domain modules or external integrations are implemented in this stage.
