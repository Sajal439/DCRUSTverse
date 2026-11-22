# DCRUSTVerse technology stack

Approved choices recorded from the project discussion.

| Area | Choice |
|---|---|
| Runtime | Latest stable Node.js, currently pinned to 26.13.1 |
| Language | TypeScript |
| Web application | React, Vite, React Router and TanStack Query |
| Backend | Express with REST endpoints and OpenAPI contracts |
| Database | Supabase PostgreSQL |
| Queries and migrations | Drizzle ORM, node-postgres and Drizzle Kit |
| Identity | Supabase Auth |
| Campus authorization | Application-owned scoped permissions in PostgreSQL and Express |
| Files | Supabase Storage with private buckets |
| Realtime | Supabase Realtime with authorized subscriptions |
| Background jobs | BullMQ, datastore to be selected when implementing workers |
| Maps | MapLibre GL JS with campus location and path data |
| 3D campus | Three.js through React Three Fiber |
| Mobile | React Native and Expo using the Express API |
| AI assistant | Retrieval from approved campus sources, provider selected during implementation |
| Hosting | Containerized API and worker, separate web deployment; provider selection pending |

## Current implementation

The backend has runtime configuration, health and readiness checks, Drizzle schema and migrations, and a Supabase access-token verification endpoint. Frontend, account onboarding, campus permissions, storage policies, workers and domain workflows remain in their scheduled stages.

The Windows helper `backend/run.ps1` selects the verified project-local Node binary under `.tools/`. The system Node installation is independent. Version-manager users can use the root `.nvmrc` or `.node-version`.

## Implementation conventions

Build in small stages with focused commits. Write test files for manual execution unless the user changes that instruction. Build and type checking are allowed.

Organize new domains under `src/modules/<domain>/` with routes, controllers, services, repositories, schemas and types as needed. Keep shared configuration, middleware, types and schemas at the root of `src/`.

Use current stable dependency releases and commit exact versions with the lockfile. Check runtime and peer compatibility during upgrades. Drizzle Kit currently brings deprecated esbuild-kit helpers transitively. The esbuild override upgrades their build dependency to the latest version and removes the reported advisory. Revisit the override when upstream removes those helpers.
