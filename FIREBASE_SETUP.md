# RW 018 — Firebase Authentication & Production Deployment

## 1. Firebase Authentication

Enable **Authentication → Sign-in method → Email/Password** in the Firebase Console.

The application no longer authenticates against `localStorage`, `initialUsers.ts`, or passwords stored in Firestore.
Passwords are owned by Firebase Authentication.

## 2. Create the initial accounts

This repository includes a one-time migration script:

```bash
npm install
# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\service-account.json"
npm run migrate:auth
```

The script creates Firebase Auth accounts for the staff roles and creates `users/{firebaseUid}` profile documents. Temporary passwords are generated and printed once; do not commit them to source control.

For RT accounts that do not have an email in the old data, the migration uses `<username>@rw018app.com` by default. You may override the domain:

```bash
RW018_AUTH_DOMAIN=your-real-domain.example npm run migrate:auth
```

If you need to reset passwords during migration:

```bash
RW018_RESET_PASSWORDS=true npm run migrate:auth
```

Do not put the service-account JSON in the repository.

## 3. Firestore rules

Deploy `firestore.rules` after the user profile documents exist:

```bash
firebase deploy --only firestore:rules
```

The production rules require an active Firebase Authentication session. Password fields are explicitly rejected from user documents. Privileged roles are controlled by the role stored in `users/{uid}` and mirrored in Firebase custom claims by the migration script.

## 4. GitHub Pages

Repository URL:

`https://lampungjayaabadi-a11y.github.io/rw018app/`

In GitHub: **Settings → Pages → Source → GitHub Actions**.

The included workflow builds with Vite using `/rw018app/` as the base path and deploys `dist/` with the official Pages artifact/deployment actions.

## 5. Firebase Authorized Domains

In Firebase Authentication → Settings → Authorized domains, add:

`lampungjayaabadi-a11y.github.io`

The Firebase Web API key in the client config is not a secret, but Firebase Auth/Firestore rules are the security boundary. Never publish a service-account key.

## 6. Resident/NIK login

The old NIK-as-password flow has been disabled in this secure build. A NIK is personal data and must not be used as a reusable password. Resident enrollment should use Firebase Authentication with an actual password/OTP/email/phone flow before resident accounts are enabled.
