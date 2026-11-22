# DCRUSTverse Remote Demonstration Guide

This guide explains how to showcase **DCRUSTverse** to professors, reviewers, or colleagues who are **not on your local Wi-Fi network** (e.g., in a different room, city, or remote call).

---

## Quick Reference: 2 Ways to Share

| Method                                | Best For                                                | What Remote Person Needs                          | Setup Time |
| :------------------------------------ | :------------------------------------------------------ | :------------------------------------------------ | :--------- |
| **Option 1: Expo Tunnel (Phone App)** | Showing the **real mobile app** on an actual smartphone | Free **Expo Go** app (Google Play / App Store)    | 30 seconds |
| **Option 2: Instant Web Link**        | Fastest demo with **zero installation**                 | Any browser (Chrome, Safari, Edge) on PC or Phone | 20 seconds |

---

## Option 1: Mobile App via Expo Tunnel (Recommended for Phone Demo)

Expo provides a built-in secure tunnel powered by ngrok. It generates a public QR code and an `exp://` link that bridges the app directly from your computer to their smartphone anywhere in the world.

### Step 1: Start the Remote Tunnel

Open PowerShell in the project root and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\share-remote.ps1 -Mode Mobile
```

_(Alternatively, navigate to `mobile/` and run `npm run share`)_

Metro Bundler will compile your app, establish the tunnel, and print a large QR code in your terminal, along with an `exp://...` URL.

### Step 2: What the Remote Person Does

1. **Install Expo Go**:
   - **Android**: Install [Expo Go from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent).
   - **iOS (iPhone)**: Install [Expo Go from Apple App Store](https://apps.apple.com/app/expo-go/id982107779).
2. **Open the App**:
   - **Android**: Open the **Expo Go** app, tap **Scan QR code**, and point at the QR code on your screen (or open the `exp://...` link sent to them).
   - **iPhone**: Open the default **Camera app**, point it at the QR code, and tap the banner that says **"Open in Expo Go"**.
3. **Explore**:
   - The app streams directly onto their device.
   - On the welcome screen, they can tap **[🎓 Student]**, **[👨‍🏫 Faculty]**, or **[🛡️ Admin]** for instant 1-tap demo access!

---

## Option 2: Instant Web Link (Zero Installation / Any Browser)

If the remote person does not want to install Expo Go, you can share an instant web link that works in Chrome, Safari, Edge, or Firefox on mobile or desktop.

### Step 1: Export and Tunnel the Web Version

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\share-remote.ps1 -Mode Web
```


```powershell
ssh -R 80:localhost:4000 nokey@localhost.run
```

_(Or run `powershell -ExecutionPolicy Bypass -File .\share-remote.ps1 -Mode BackendTunnel`)_

This connects in 1 second and prints a clean public HTTPS URL, for example:
`tunneled with tls termination, https://31dc95e781975e.app.lhr.life`

Add this URL with `/api/v1` to `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://31dc95e781975e.app.lhr.life/api/v1
```

---

## Interactive Portals & Demonstration Script

DCRUSTverse includes **1-Tap Demo Logins** so anyone testing remotely does not need to type usernames or passwords:

### 1. 🎓 Student Portal (`student@dcrustm.org`)

- **Home Dashboard**: Displays student avatar, enrolled degree (B.Tech CSE 6th Sem), CGPA (8.72), attendance summary (86.4%), upcoming assignment deadlines, and quick navigation.
- **Academics Tab**:
  - Daily timetable with lecture halls and faculty names.
  - Course-by-course attendance tracking with **Shortage Warning Alerts** if attendance drops below 75%.
  - Pending assignment submission list.
- **Digital ID Tab**:
  - Official university digital student identity card.
  - Dynamic cryptographic QR code with a **5-minute rolling countdown timer** (prevents screenshot proxy attendance).
  - Anti-tamper holographic security watermark.
- **Transit Tab**:
  - Real-time IoT campus bus tracking (Bus #04 Sonipat Express).
  - Route stop progression timeline and live passenger occupancy meter.
- **AI Help Tab**:
  - Conversational **DCRUSTbot** AI assistant grounded with academic handbook citations.

### 2. 👨‍🏫 Faculty Portal (`faculty@dcrustm.org`)

- **Teaching Overview**: Active course sections (Distributed Systems, Cloud Architecture), total enrolled students, pending evaluations count.
- **Teaching Tab**:
  - **Interactive Roll Call**: Daily student roster with toggleable `[Present]`, `[Absent]`, and `[Late]` buttons.
  - **Grading & Evaluation Modal**: Review student lab submissions, input scores (out of 100), and write constructive feedback.
  - **Attendance Correction Claims Queue**: Review student absence dispute claims with medical/sports certificates, with 1-tap **Approve** or **Reject** actions.

### 3. 🛡️ Administrator Portal (`admin@dcrustm.org`)

- **Central Overview**: System health metrics, active student/faculty headcounts, unresolved grievances, and system audit trail.
- **Users Management Tab**:
  - Search and filter campus directory across Students, Faculty, and Admin staff.
  - Real-time Account Status Toggle (Active vs. Deactivated / Suspended).
  - **+ Add User** Provisioning Modal: Issue new student roll numbers or faculty employee IDs.
- **Complaints & Circulars**: Central campus grievance tickets and university notices.

---

## Option 3: Permanent Cloud Deployment (24/7 Link)

For a permanent demo link that stays online 24/7 even after you turn off your laptop:

### A. Frontend (Web version) on Vercel or Netlify (Free)

1. In `mobile/`: run `npx expo export --platform web`.
2. Deploy the `mobile/dist` directory to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) by dragging and dropping or connecting your GitHub repo.
3. You get a permanent `https://dcrustverse.vercel.app` URL.

### B. Backend on Render.com or Railway (Free)

1. DCRUSTverse includes a production-ready `backend/Dockerfile`.
2. Connect your GitHub repository to [Render](https://render.com) (Web Service) or [Railway](https://railway.app).
3. Set environment variables from `backend/.env` (Database is already in the cloud on Supabase PostgreSQL).
4. Render gives a permanent `https://dcrustverse-api.onrender.com` backend URL.
