# Android submission handover

This document tracks the submission work, not a claim that all proposal acceptance scenarios have passed. Automated test files have been written but not executed, as requested.

## Live application

The live app uses Home, Academics, Services, Inbox and Profile tabs. Services are searchable and grouped. Registration, verified Supabase login, onboarding and approval are separate states. A cached profile cannot authenticate a user or grant a role. Preview buttons remain explicitly labelled and do not call the live API.

Implemented interfaces include timetable, attendance summary/corrections/roll call, assignment publication/text submission/grading/results, appointments and office hours, hostel applications/rooms/transfers/allocation, library catalogue/copies/reservations/loans, complaints/comments/status, facilities/bookings, documents, clubs/events, placements/applications, notices/notifications, lost-and-found claims, directory, campus locations/routes, buses/sensors, profile editing, academic setup, user account status/role actions, audit history, summaries, integration-run viewing, surveys, the campus assistant and digital IDs. The Android scanner supports the project's ID and location QR formats.

Forms use separate Zod schemas and TypeScript types. Writes report success only after the API succeeds. Empty, loading and error states are distinct. Backend failures do not produce local fake tickets or credentials in live mode.

## Accounts and demonstration records

The confirmed Supabase identities `student@dcrustm.org`, `faculty@dcrustm.org` and `admin@dcrustm.org` have been linked to active student, faculty and administrator campus accounts respectively, with the user's approval. Passwords were not read, generated or changed. Use the existing passwords privately in the app.

The supplied `23001001107sajal@dcrustm.org` address was not found in the configured Supabase project at inventory time. It must be registered and verified before it can be linked. Administrator account setup is complete; Android sign-in and role-specific workflows still require manual verification.

`backend/src/scripts/setup-demonstration.ts` links existing verified identities and inserts deterministic, labelled fixtures in one transaction. It preserves existing fixture rows, refuses disabled accounts, and does not reset workflows on rerun. Run from `backend` with the project-local Node executable:

```powershell
& '..\.tools\node-v26.13.1-win-x64\node.exe' --env-file=.env src/scripts/setup-demonstration.ts --student-email student@dcrustm.org --faculty-email faculty@dcrustm.org
```

This previews the setup. Add `--apply` to perform the configured changes. An optional `--admin-email VERIFIED_ADDRESS` links that verified identity to the administrator role. Only supply an address explicitly selected by the project owner. The script does not create Supabase identities or email passwords.

## Android build and backend availability

`mobile/eas.json` has a private internal-distribution APK profile named `preview`. The Expo project is `@sajal439/dcrustverse`. Upload to Expo was explicitly approved by the user. The mobile archive excludes backend files, `.env` files and tests. Production app-bundle output is configured separately.

The current preview profile embeds `https://dcrust-backend-live.loca.lt/api/v1`. This is a development tunnel, not permanent hosting. The phone needs internet access and the backend computer must remain awake. Start the backend and tunnel with:

```powershell
.\start-android-demo.ps1
```

Confirm the printed tunnel URL matches the APK address. A different URL requires an updated preview configuration and APK rebuild. A backend availability failure is displayed as an error, not replaced by sample data.

To rebuild from `mobile` using the signed-in Expo account:

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
npx --yes eas-cli@latest build --platform android --profile preview
```

Follow the generated private build link to download the APK. An Android JavaScript/Hermes export is not an APK. Native compilation and installation must finish before calling the app installable.

## Demonstration sequence to perform on Android

These are pending manual checks, not recorded passes:

1. Install the APK, sign in as student, and verify the real account name and demonstration records.
2. Submit the demonstration assignment; restart the app and confirm the submission persists.
3. Sign in as faculty, load the assigned class roster, record attendance, grade the submission and publish the section's results.
4. Return to the student account and inspect attendance, submission feedback and results.
5. Create a complaint. Resolve it through the administrator account, then reopen it as its creator.
6. Reserve a library book, issue and return a copy through authorized staff, and inspect the loan record.
7. Request a facility booking/document and review its saved status through the administrator account.
8. Register for the sample event, apply for the sample opportunity and answer the survey.
9. Show a digital ID QR on one device and verify it on another. Expired/revoked IDs must not show as valid. Check camera denial and pasted-code fallback.
10. Turn off network access: verify that writes show failure and do not claim success. Restore connectivity and retry.
11. Check Android Back, keyboard visibility, notch/safe-area layout and sign-out/account switching.

## Remaining completion work

See [the latest backend/mobile workflow pass](BACKEND_FRONTEND_COMPLETION.md) for implemented improvements and their external setup requirements.

The proposal scope is larger than the existing backend contracts. Do not claim these are finished based on the new screens:

- Complete the scoped authorization audit across all modules, including faculty/department/hostel access.
- Configure Firebase/FCM and verify the new persistent push registry and delivery worker on Android. In-app updates currently refresh through the API; a real-time subscription is not implemented.
- Verify the new private attachment, staff-issued certificate and transactional account-import workflows. Submission revision history and automatic certificate generation/signing remain additional work.
- Configure the Supabase recovery redirect and verify the implemented Android recovery flow with a real email.
- Verify the new anonymous-survey participation limits; complete advanced report exports, approval aggregation and remaining cancellation/renewal workflows.
- Deliver and verify a genuine interactive 3D campus model and verified walking-path data.
- Commission real bus/sensor feeds and external university integrations separately from labelled demonstration data.
- Verify every acceptance scenario in `PROJECT_REQUIREMENTS.md` on real accounts and an Android device. Automated test execution remains pending user authorization.

The current implementation is a substantial functional integration pass. It is not yet a verified completion of all 37 proposal requirements.

## References

APK configuration follows [Expo's APK build documentation](https://docs.expo.dev/build-reference/apk/). Source upload exclusions follow [Expo's archive guidance](https://docs.expo.dev/build-reference/project-upload/). Registration uses [Supabase signUp](https://supabase.com/docs/reference/javascript/auth-signup). Camera scanning follows [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/).
