# Backend and mobile workflow completion

## Implemented in this pass

| Workflow | Backend | Mobile entry point |
| --- | --- | --- |
| Role administration | List/remove assignments; scope and department checks; prevent self-removal and department-head privilege escalation | Services → Campus accounts → Manage roles; scoped assignment actions |
| Digital ID revocation | Existing revocation API connected | Campus accounts → Revoke digital ID |
| Campus paths | List/add paths, endpoint validation, accurate accessibility result, correct `accessibleOnly=false` parsing | Services → Campus walking paths; Campus explorer → Add entrance |
| Bulk accounts | Validate up to 200 rows; atomic import of confirmed Supabase identities; new accounts pending; preserve existing accounts; audited import; formula-safe export | Services → Import & export users |
| University data import | Validated attendance/grade/directory writes in a transaction; repeated keys return the recorded result; conflicting key reuse rejected | Services → Import university record; Integration runs |
| Private attachments | Authenticated uploads/downloads; PDF/PNG/JPEG/text checks; 2 MB per file, 20 MB per account; private database storage with RLS | Assignment submission and feedback; document issuance/download |
| Certificates | Scoped review, no self-approval, approval required before issuance, attachment required to issue, completed state protected | Services → Document requests → Review request |
| Push notifications | Persistent device registry, removal, notice inbox fan-out, persistent delivery queue, Expo tickets/receipts, bounded send retries, invalid-device disabling | Services → Notification settings |
| Password recovery | Supabase recovery email and session validation | Forgot password on sign-in; Android recovery deep link → new-password form |
| Academic permissions | Class membership/teaching checks on assignment endpoints, grade limits, grading updates, unpublished grade hiding | Existing assignment/submission/results screens |
| Surveys | Validate question IDs and choices, reject duplicates, enforce response limit transactionally, separate participation ledger for anonymous answers, restrict aggregation | Surveys & feedback, including anonymous survey creation |
| Assistant/notices | Notice expiry and department filters; remove invented library opening hours | Campus assistant and notices |

University import is a manual transfer into this project's database. It does not claim to fetch from a university ERP without an external API configuration. Exam imports save grades; publishing results remains a separate faculty/administrator action.

Anonymous answer rows do not contain user IDs. A separate private participation ledger records who participated to enforce one response. This is application-level anonymity, not a guarantee against database administrators correlating timing or answer content. Existing anonymous responses from before the ledger cannot be attributed retrospectively.

Attachments are stored privately in PostgreSQL for this deployment. They are downloaded only after account/record access checks, then shared through the Android share sheet. PDFs are supplied by authorized staff; automatic university-approved certificate generation/signing is not implemented. Uploads have format checks but no malware-scanning service.

## Database and verification

- Additive migrations `0004_eager_molecule_man.sql` and `0005_mean_marten_broadcloak.sql` were generated and applied to the configured database.
- Backend and mobile TypeScript checks and backend compilation were performed. Android Hermes export was performed; this is not an APK or a device workflow check.
- Regression files: `backend/test/backend-completion.test.ts` and `mobile/test/completion-validation.test.mjs`. Existing campus test doubles were updated for the path-list API.
- No automated tests were executed, as requested. Real Android sign-in, upload, sharing, camera and role workflows still need manual verification.

## External setup still required

### Android push

The user confirmed Firebase/FCM is not configured. Register Android package `com.dcrustverse.campus` in Firebase. Configure the client `google-services.json` via Expo's Android `googleServicesFile` setting and upload the FCM v1 service-account credential through EAS credentials. Keep the service-account private key out of Git and the mobile source archive. Then rebuild and install the APK and enable notifications on a physical device.

Follow [Expo push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) and [FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/). A push ticket means Expo accepted the message; a receipt means the platform accepted delivery, not that a person read it. The in-app inbox works independently of FCM.

### Password recovery

Add `dcrustverse://auth/recovery` to Supabase **Authentication → URL Configuration → Redirect URLs**. Recovery uses the project's email provider. Install a rebuilt APK with the `dcrustverse` scheme, then open the recovery email on that device. See [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

### Deployment

Restart the backend to load the new code after migration. Rebuild the APK: the old APK cannot contain the new native notification/file modules or recovery scheme. The configured API tunnel is temporary; remote demonstration still requires a reachable backend. No new APK or successful real-device acceptance run is claimed by this change.

The remaining proposal-wide work in `ANDROID_SUBMISSION.md` remains separate from this implementation pass: real external feeds, verified campus mapping, all cancellation/renewal flows, and complete device acceptance.
