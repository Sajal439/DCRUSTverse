# DCRUSTverse Mobile Application (React Native / Expo)

The official cross-platform mobile client for **Deenbandhu Chhotu Ram University of Science & Technology (DCRUST)** students, faculty, and campus staff. Built with **React Native**, **Expo SDK 52**, and **TypeScript**, directly integrated with the DCRUSTverse Express REST API and Supabase Authentication.

---

## Features Implemented

1. **Campus Authentication & Profile Onboarding**
   - Supabase Auth session management (`@supabase/supabase-js`)
   - Secure local persistence via `@react-native-async-storage/async-storage`
   - Scoped campus roles: `student`, `faculty`, `department_head`, `librarian`, `hostel_warden`, `administrator`, etc.
   - Quick demo account presets for rapid testing and demonstrations

2. **Student & Faculty Dashboard**
   - Role-specific greeting with roll number / employee ID
   - Daily schedule quick view (today's lecture halls, labs, faculty)
   - Metrics tiles: Aggregate Attendance %, Pending Assignments, Open Maintenance Complaints
   - Live campus circulars teaser banner

3. **Digital Campus ID (F32)**
   - Official University Identity Card with DCRUST crest and student details
   - Dynamic cryptographic QR code with rolling expiration countdown timer (5-minute security interval)
   - Real-time `ACTIVE` vs `REVOKED` credential verification
   - Security hologram watermark and anti-screenshot advisory

4. **Academic Workflows (F04, F05, F06)**
   - **Timetable**: Day-by-day class schedule with lecture timings, rooms, and instructor names
   - **Attendance**: Subject-by-subject percentage tracking, visual progress bars, low-attendance alert for subjects below 75%, and a built-in "Request Attendance Correction" modal
   - **Assignments**: Filter between Pending, Submitted, and Graded assignments with submission upload modal

5. **Complaints & Service Requests (F10)**
   - Categorized maintenance tickets: `hostel`, `electrical`, `it_network`, `sanitation`, `academics`
   - Status tracking badges: `open`, `in_progress`, `resolved`, `closed`
   - "+ New Ticket" submission form routing directly to university administrators and maintenance staff

6. **Targeted Notices & Circulars (F13)**
   - Category filters: `academic`, `placement`, `event`, `administrative`, `urgent`
   - Search bar across all notices
   - Full announcement modal with verified issuing authority

7. **Campus Explorer & QR Scanner (F14, F31)**
   - Searchable directory of campus buildings (C.V. Raman Block, Central Library, Saraswati Block, Hostels, Sports Complex)
   - Operating hours, wheelchair accessibility indicators, facility lists, and GPS coordinates
   - Built-in QR scanner simulation for door and building entrance markers

8. **Live IoT Bus Telemetry (F33)**
   - Real-time GPS vehicle tracking for Internal Campus Circular Shuttle and Sonipat City Feeder
   - Live telemetry status: Vehicle number, driver duty contact, speed, occupancy, and fresh vs stale telemetry indicators
   - Interactive route stop progression timeline with current stop indicator and ETAs

9. **AI Campus Assistant — DCRUSTbot (F30)**
   - Conversational campus chat interface
   - Sourced citations referencing official university ordinances and handbooks
   - Quick prompt suggestion chips

10. **Low-Connectivity & Offline Mode (F28)**
    - Automatic caching of student profile, timetable, and campus circulars
    - Visible "Offline Mode — Showing Cached Campus Data" banner when the device loses network connectivity
    - Private cache securely purged on logout

---

## Sharing with someone outside your network

Run `./mobile/run.ps1 share` from the repository root. This starts Expo Go with a public development tunnel. Share the URL or QR code printed by Expo with the reviewer, who needs an Expo Go version compatible with SDK 58. Keep this computer awake and the Expo process running for the demonstration.

The tunnel serves the mobile application bundle. Live API features also require `EXPO_PUBLIC_API_URL` to point to a publicly reachable HTTPS backend ending in `/api/v1`. A private LAN address or localhost will not work from the reviewer's network. Restart Expo after changing that variable.

The existing one-tap demo accounts and fallback data support a UI walkthrough. They do not demonstrate authenticated live backend workflows. Bus telemetry and some assistant responses currently contain sample data.

## Getting Started

### Prerequisites
- Node.js `>=24.0.0` or project-local Node in `.tools/node-v26.13.1-win-x64`
- PowerShell on Windows (or bash on Linux/macOS)

### Running on Android / Local Development

1. **Start the Backend API**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\backend\run.ps1 dev
   ```
   *(Backend starts on `http://127.0.0.1:4000/api/v1`)*

2. **Run TypeScript Check**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\mobile\run.ps1 typecheck
   ```

3. **Start Expo Development Server**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\mobile\run.ps1 start
   ```

4. **Launch on Android**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\mobile\run.ps1 android
   ```
   *Note*: The Android Emulator connects to `http://10.0.2.2:4000/api/v1` automatically. For physical Android devices connected via USB, run:
   ```bash
   adb reverse tcp:4000 tcp:4000
   ```

5. **Run in Web Browser**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\mobile\run.ps1 web
   ```

---

## Packaging and Distribution Targets (F35)

- **Android Target**:
  - Development build: Expo Go or `npx expo run:android`
  - Production build: Android Application Bundle (`.aab`) and standalone APK via `eas build --platform android`
- **iOS Target**:
  - Development build: Expo Go or `npx expo run:ios` (macOS required)
  - Production build: iOS Archive (`.ipa`) via `eas build --platform ios`
