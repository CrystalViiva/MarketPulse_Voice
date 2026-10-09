import 'dotenv/config';
const required=['DATABASE_URL','TEST_DATABASE_URL','DEMO_DATABASE_URL','BETTER_AUTH_SECRET','BETTER_AUTH_URL','APP_ENV','TRANSCRIPTION_MODE'];
let bad=false;
for(const name of required){const present=Boolean(process.env[name]);console.log(`${name}: ${present?'present':'MISSING'}`);if(!present)bad=true;}
if((process.env.BETTER_AUTH_SECRET?.length??0)<32){console.error('BETTER_AUTH_SECRET: at least 32 characters required');bad=true;}
if(new Set([process.env.DATABASE_URL,process.env.TEST_DATABASE_URL,process.env.DEMO_DATABASE_URL]).size!==3){console.error('Database URLs must target three distinct databases.');bad=true;}
if(!['disabled','fixture'].includes(process.env.TRANSCRIPTION_MODE??'')){console.error('TRANSCRIPTION_MODE: supported values are disabled or fixture');bad=true;}
if(process.env.APP_ENV==='production'&&process.env.TRANSCRIPTION_MODE==='fixture'){console.error('Production must not enable fixtures.');bad=true;}
console.log('Live N-ATLAS ASR: unavailable; official hosted API contract and access are still required.');
process.exitCode=bad?1:0;
