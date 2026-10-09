import 'dotenv/config';
import { spawnSync, spawn } from 'node:child_process';
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  !new URL(url).pathname.endsWith('/marketpulse_test') ||
  url === process.env.DATABASE_URL
)
  throw new Error('Refusing browser tests outside isolated marketpulse_test.');
const env = {
  ...process.env,
  DATABASE_URL: url,
  APP_ENV: 'test',
  BETTER_AUTH_URL: 'http://localhost:3100',
  TRANSCRIPTION_MODE: 'fixture',
  NEXT_DIST_DIR: '.next-e2e',
};
const migration = spawnSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  { stdio: 'inherit', env },
);
if (migration.status !== 0) process.exit(migration.status ?? 1);
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3100'],
  { stdio: 'inherit', env },
);
child.on('exit', (code) => process.exit(code ?? 1));
