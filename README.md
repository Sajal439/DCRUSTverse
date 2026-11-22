# DCRUSTVerse

A unified digital campus platform for DCRUST, planned around student, faculty, and administrative services and a Digital Campus Explorer.

## Current status

Backend development proceeds in small stages. The TypeScript/Express API now includes PostgreSQL pooling, SQL migrations, and health/readiness endpoints. See `backend/README.md` for setup. Authentication and domain modules are pending.

- `DCRUSTVerse_Project_Proposal.docx` — original proposal.
- `PROJECT_REQUIREMENTS.md` — agreed scope, role boundaries and acceptance scenarios.
- `IMPLEMENTATION_PLAN.md` — delivery checklist and demonstration journeys.

## Development approach

Build the backend first in small, reviewable stages. Each stage should document its scope, include appropriate verification, and receive a focused commit before proceeding to the next agreed stage. Do not implement the entire backend in one pass.

Start with repository and backend scaffolding, then database setup, authentication, permissions, and individual domain modules. The backend uses Node.js 24, TypeScript, Express and PostgreSQL. Deployment configuration remains pending. Keep credentials, local databases, generated output and installed dependencies out of Git.
