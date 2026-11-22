# DCRUSTVerse

A unified digital campus platform for DCRUST, planned around student, faculty, and administrative services and a Digital Campus Explorer.

## Current status

Backend development has started in small stages. Stage 1 contains the TypeScript/Express API scaffold; see `backend/README.md` for setup and endpoint details. Database and domain modules are pending.

- `DCRUSTVerse_Project_Proposal.docx` — original proposal.
- `PROJECT_REQUIREMENTS.md` — agreed scope, role boundaries and acceptance scenarios.
- `IMPLEMENTATION_PLAN.md` — delivery checklist and demonstration journeys.

## Development approach

Build the backend first in small, reviewable stages. Each stage should document its scope, include appropriate verification, and receive a focused commit before proceeding to the next agreed stage. Do not implement the entire backend in one pass.

Start with repository and backend scaffolding, then database setup, authentication, permissions, and individual domain modules. The backend uses Node.js 24, TypeScript and Express; database and deployment choices remain to be finalized. Keep credentials, local databases, generated output and installed dependencies out of Git.
