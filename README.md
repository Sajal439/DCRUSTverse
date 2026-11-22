# DCRUSTVerse

[![Download Android APK](https://img.shields.io/badge/Download-Android%20APK%20(v1.0.0)-brightgreen?logo=android&style=for-the-badge)](https://github.com/Sajal439/DCRUSTverse/releases/latest/download/DCRUSTverse.apk)
[![Release](https://img.shields.io/github/v/release/Sajal439/DCRUSTverse?style=for-the-badge&color=blue)](https://github.com/Sajal439/DCRUSTverse/releases/tag/v1.0.0)

A unified digital campus platform for DCRUST, planned around student, faculty, and administrative services and a Digital Campus Explorer.

## Current status

Backend development proceeds in small stages. The TypeScript/Express API includes PostgreSQL pooling, Drizzle migrations, Supabase identity verification, and health/readiness endpoints. See `backend/README.md` for setup and `TECH_STACK.md` for the approved stack. Campus account onboarding, permissions and domain modules are pending.

- `DCRUSTVerse_Project_Proposal.docx` — original proposal.
- `PROJECT_REQUIREMENTS.md` — agreed scope, role boundaries and acceptance scenarios.
- `IMPLEMENTATION_PLAN.md` — delivery checklist and demonstration journeys.

## Project Architecture & Applications

1. **Backend API (`backend/`)**:
   - Node.js 26 + TypeScript + Express REST API.
   - Supabase Auth + Drizzle ORM over PostgreSQL.
   - Comprehensive implementation of Phases 0 through 7 covering 37 campus features (F01–F37) and 58 automated integration/journey tests.

2. **Mobile Frontend (`mobile/`)**:
   - React Native + Expo (SDK 58) + TypeScript.
   - Role-tailored dashboards and navigation for **Student**, **Faculty**, and **Administrator**.
   - Features: Timetable & Attendance, Roll Call, Grading Submissions, Attendance Claims Queue, Dynamic Expiring Digital ID (5-min rolling QR), Real-time Transit Telemetry, Grievance Management, and DCRUSTbot AI Campus Assistant.
   - Dual runtime support: Physical iOS/Android devices (via Expo Go) and Web browsers (`react-native-web`).

## Demonstrating Remotely

To showcase DCRUSTverse to reviewers, professors, or clients who are away from your local network:

```powershell
# Option 1: Mobile App via Expo Tunnel (for remote testing on an actual phone)
powershell -ExecutionPolicy Bypass -File .\share-remote.ps1 -Mode Mobile

# Option 2: Instant Web Link (zero installation, opens in any browser)
powershell -ExecutionPolicy Bypass -File .\share-remote.ps1 -Mode Web
```

For full walkthrough steps, 1-tap demo credentials, and cloud deployment guides, see [docs/REMOTE_DEMO_GUIDE.md](file:///c:/Users/Lenovo/Desktop/DCRUSTverse/docs/REMOTE_DEMO_GUIDE.md).
