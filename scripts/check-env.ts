import 'dotenv/config';
const production = process.env.APP_ENV === 'production';
const required = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'APP_ENV',
  'TRANSCRIPTION_MODE',
  ...(production ? [] : ['TEST_DATABASE_URL', 'DEMO_DATABASE_URL']),
];
let bad = false;
for (const name of required) {
  const present = Boolean(process.env[name]);
  console.log(`${name}: ${present ? 'present' : 'MISSING'}`);
  if (!present) bad = true;
}
if ((process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32) {
  console.error('BETTER_AUTH_SECRET: at least 32 characters required');
  bad = true;
}
if (
  !production &&
  new Set([process.env.DATABASE_URL, process.env.TEST_DATABASE_URL, process.env.DEMO_DATABASE_URL])
    .size !== 3
) {
  console.error('Database URLs must target three distinct databases.');
  bad = true;
}
for (const name of required.filter((n) => n.endsWith('_URL'))) {
  try {
    const url = new URL(process.env[name] ?? '');
    if (name === 'BETTER_AUTH_URL') {
      if (production && url.protocol !== 'https:') throw new Error();
    } else if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  } catch {
    console.error(`${name}: invalid URL configuration`);
    bad = true;
  }
}
if (!['disabled', 'fixture'].includes(process.env.TRANSCRIPTION_MODE ?? '')) {
  console.error('TRANSCRIPTION_MODE: supported values are disabled or fixture');
  bad = true;
}
if (process.env.APP_ENV === 'production' && process.env.TRANSCRIPTION_MODE === 'fixture') {
  console.error('Production must not enable fixtures.');
  bad = true;
}
console.log(
  'Live N-ATLAS ASR: unavailable; official hosted API contract and access are still required.',
);
process.exitCode = bad ? 1 : 0;
