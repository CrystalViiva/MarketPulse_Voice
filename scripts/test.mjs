import 'dotenv/config';
import { spawnSync } from 'node:child_process';
const url=process.env.TEST_DATABASE_URL;
if(!url||!new URL(url).pathname.endsWith('/marketpulse_test')||url===process.env.DATABASE_URL)throw new Error('TEST_DATABASE_URL must target isolated marketpulse_test.');
const env={...process.env,DATABASE_URL:url,APP_ENV:'test',BETTER_AUTH_URL:'http://localhost:3100',TRANSCRIPTION_MODE:'fixture'};
for(const args of [['node_modules/prisma/build/index.js','migrate','deploy'],['node_modules/vitest/vitest.mjs','run']]){const p=spawnSync(process.execPath,args,{stdio:'inherit',env});if(p.status!==0)process.exit(p.status??1);}
