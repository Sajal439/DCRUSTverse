# DCRUSTVerse mobile

React Native / Expo SDK 58 client using Supabase Auth, React Navigation bottom tabs and react-native-safe-area-context.

Live sessions use the campus API. Preview accounts are explicitly labelled and use local sample screens; they do not demonstrate saved backend workflows.

## Run

From the repository root:

```powershell
.\mobile\run.ps1 start
.\mobile\run.ps1 typecheck
```

Configure the public API URL in `mobile/.env`. A remote phone needs an HTTPS URL reachable outside your local network. Do not put backend secrets in mobile configuration.

## Implemented workflows

The live workspace includes academics, attendance, assignments and private attachments, hostel/library services, complaints, bookings, document review/issuance, clubs/events, placements, surveys, campus information, QR/digital ID, role administration, account import/export, notification settings and manual university-record imports. Password recovery uses an app deep link.

See [workflow coverage and setup](../docs/BACKEND_FRONTEND_COMPLETION.md) for the exact implementation and external requirements, and [Android handover](../docs/ANDROID_SUBMISSION.md) for the pending device walkthrough.

## Android delivery

`eas.json` defines an internal APK preview profile. New native packages and deep-link schemes require rebuilding the APK. Expo Go alone does not verify production push notifications.

Firebase/FCM credentials are not yet configured. Supabase needs the recovery redirect `dcrustverse://auth/recovery`. Existing previews do not include these new changes until rebuilt.

## Verification limits

Test files are written but have not been run. Typechecks and bundling do not establish successful real-device workflows or completion of every proposal requirement. Live bus hardware, university ERP access and a verified 3D campus model are not supplied by this client.
