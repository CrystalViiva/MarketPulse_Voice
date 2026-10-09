import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const url=process.env.DEMO_DATABASE_URL;
if(process.env.APP_ENV==='production'||!url||!new URL(url).pathname.endsWith('/marketpulse_demo')||url===process.env.DATABASE_URL)throw new Error('Demo seed requires the isolated marketpulse_demo database.');
process.env.DATABASE_URL=url;
const migrate=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{stdio:'inherit',env:process.env});if(migrate.status!==0)process.exit(1);
const {db}=await import('../src/lib/db');const {auth}=await import('../src/lib/auth');const {createDraft,confirmDraft}=await import('../src/lib/ledger');const {emptyCandidate,lagosDate}=await import('../src/lib/domain');
try{
 const email='demo@marketpulse.test';let user=await db.user.findUnique({where:{email}});
 if(!user){const password=randomBytes(18).toString('base64url');const result=await auth.api.signUpEmail({body:{email,password,name:'Demo Merchant'}});user=result.user;await writeFile('.local/demo-login.txt',`Only for isolated demo database\nEmail: ${email}\nPassword: ${password}\n`);}
 let membership=await db.membership.findUnique({where:{userId:user.id}});
 if(!membership){const business=await db.business.create({data:{name:'Amina’s provisions — DEMO',mode:'demo',memberships:{create:{userId:user.id}}}});membership=await db.membership.findUniqueOrThrow({where:{userId:user.id}});void business;}
 const s={businessId:membership.businessId,actorId:user.id};
 const draft=await createDraft(s,{...emptyCandidate('fixture'),type:'SALE',item:'Rice — synthetic example',total:'40000',quantity:'5',unit:'bags',eventDate:lagosDate(),paymentState:'unpaid',counterparty:'Amina'},'demo-credit-sale-v1');
 await confirmDraft(s,draft.id,draft.version,true);
 console.log('Idempotent demo seed ready. Credentials are in ignored .local/demo-login.txt; no credentials printed. Start with DEMO_DATABASE_URL as DATABASE_URL to use this isolated dataset.');
}finally{await db.$disconnect();}
