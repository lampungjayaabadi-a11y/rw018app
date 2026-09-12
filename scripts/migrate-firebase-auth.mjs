/**
 * One-time Firebase Authentication migration for RW 018.
 *
 * Requirements:
 *   1. Create/download a Firebase service-account JSON from Firebase/Google Cloud.
 *   2. Set GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json
 *   3. Run: npm run migrate:auth
 *
 * The script creates Firebase Auth accounts and matching users/{uid} profile docs.
 * It NEVER writes passwords into Firestore or source files.
 * Random temporary passwords are printed once to the terminal; deliver them securely
 * and require users to change them in your chosen onboarding flow.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const config = JSON.parse(fs.readFileSync(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));


function loadInitialUsers() {
  const text = fs.readFileSync(new URL('../src/data/initialUsers.ts', import.meta.url), 'utf8');
  const matches = [...text.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?username:\s*'([^']+)'[\s\S]*?nama:\s*'([^']+)'[\s\S]*?role:\s*'([^']+)'[\s\S]*?roleLabel:\s*'([^']+)'[\s\S]*?rtAccess:\s*'([^']+)'[\s\S]*?isActive:\s*(true|false)[\s\S]*?description:\s*'([^']*)'/g)];
  return matches.map((m) => ({ id:m[1], username:m[2], nama:m[3], role:m[4], roleLabel:m[5], rtAccess:m[6], isActive:m[7] === 'true', description:m[8] }));
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('ERROR: Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service-account JSON.');
  process.exit(1);
}

if (!getApps().length) initializeApp({ credential: cert(JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))), projectId: config.projectId });
const adminAuth = getAuth();
const db = getFirestore();
const users = loadInitialUsers().filter((u) => u.role !== 'warga');
const domain = process.env.RW018_AUTH_DOMAIN || 'rw018app.com';

function tempPassword() {
  return `RW18-${crypto.randomBytes(9).toString('base64url')}`;
}
function emailFor(u) {
  const safe = u.username.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `${safe}@${domain}`;
}

const credentials = [];
for (const u of users) {
  const email = emailFor(u);
  let record;
  try { record = await adminAuth.getUserByEmail(email); }
  catch (e) { if (e.code !== 'auth/user-not-found') throw e; }

  const password = process.env.RW018_TEMP_PASSWORD || tempPassword();
  if (!record) {
    record = await adminAuth.createUser({ email, password, displayName: u.nama, disabled: !u.isActive });
  } else if (process.env.RW018_RESET_PASSWORDS === 'true') {
    await adminAuth.updateUser(record.uid, { password, disabled: !u.isActive });
  }

  await adminAuth.setCustomUserClaims(record.uid, { role: u.role, rtAccess: u.rtAccess || 'ALL' });
  await db.collection('users').doc(record.uid).set({
    id: record.uid,
    firebaseUid: record.uid,
    username: u.username,
    nama: u.nama,
    role: u.role,
    roleLabel: u.roleLabel,
    rtAccess: u.rtAccess || 'ALL',
    email,
    isActive: u.isActive,
    description: u.description,
    migratedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  credentials.push({ username: u.username, email, uid: record.uid, temporaryPassword: password });
}

console.log('\nFirebase Authentication migration complete.\n');
console.table(credentials);
console.log('\nIMPORTANT: temporary passwords are shown only here. Do not commit or paste them into source code.');
