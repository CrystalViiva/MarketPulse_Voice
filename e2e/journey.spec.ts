import { expect,test,APIRequestContext } from '@playwright/test';
const unique=()=>crypto.randomUUID();
async function register(request:APIRequestContext,name='Browser merchant'){
 const email=`test-${unique()}@example.test`;const password=`Test-only-${unique()}`;
 const res=await request.post('/api/auth/sign-up/email',{data:{name,email,password},headers:{Origin:'http://localhost:3100'}});expect(res.ok(),await res.text()).toBeTruthy();
 const business=await request.post('/api/actions',{data:{action:'onboard',name:'Amina’s provisions — BROWSER DEMO',mode:'demo'},headers:{Origin:'http://localhost:3100'}});expect(business.ok()).toBeTruthy();return {email,password};
}
test('mobile clarification, read-back, persistent ledger, debts and private report',async({page})=>{
 await page.setViewportSize({width:390,height:844});await register(page.request);await page.goto('/');
 await expect(page.getByRole('heading',{name:'Let’s book your day.'})).toBeVisible();
 await page.getByLabel('I agree to process this recording').check();await page.getByRole('button',{name:'Ambiguous rice sale'}).click();
 await expect(page.getByText('A few details to clarify')).toBeVisible();await expect(page.getByRole('button',{name:'Confirm & save record'})).toBeDisabled();
 await page.getByLabel('Total amount (₦)',{exact:true}).fill('40000');await page.getByLabel('Date in Lagos').fill('2026-10-09');await page.getByLabel('Customer / supplier alias').fill('Amina');await page.getByLabel('Payment status').selectOption('unpaid');
 await page.getByRole('button',{name:'Update draft & read back'}).click();await expect(page.getByText('PLEASE CHECK BEFORE SAVING')).toBeVisible();
 await page.screenshot({path:'test-results/mobile-readback.png',fullPage:true});await page.getByLabel('I have checked this version.').check();await page.getByRole('button',{name:'Confirm & save record'}).click();
 await expect(page.getByText('Record confirmed and saved.')).toBeVisible();await page.reload();
 await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Debts'}).click();await expect(page.getByText('Amina',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Record collection'}).click();
 await page.getByLabel('Total amount (₦)',{exact:true}).fill('15000');await page.getByRole('button',{name:'Update draft & read back'}).click();await page.getByLabel('I have checked this version.').check();await page.getByRole('button',{name:'Confirm & save record'}).click();await expect(page.getByText('Record confirmed and saved.')).toBeVisible();
 await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('button',{name:'Summary'}).click();await expect(page.getByText('₦25,000',{exact:true})).toBeVisible();await expect(page.getByText('₦15,000',{exact:true}).first()).toBeVisible();
 await page.getByLabel('I choose to share this business').check();await page.getByRole('button',{name:'Create private report link'}).click();const link=await page.getByLabel('Copy this private link').inputValue();const lender=await page.context().newPage();await lender.goto(link);await expect(lender.getByText('PRIVATE BUSINESS REPORT · READ ONLY')).toBeVisible();await expect(lender.getByText('No credit score, loan approval or lender partnership is implied.')).toBeVisible();await lender.screenshot({path:'test-results/lender-report.png',fullPage:true});
 await page.getByRole('button',{name:'Revoke link'}).click();await lender.reload();await expect(lender.getByRole('heading',{name:'This report link is unavailable'})).toBeVisible();
});
test('real sign-in, denied microphone, recoverable provider failure and keyboard entry',async({page})=>{
 const credentials=await register(page.request);await page.goto('/');await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Already have an account? Sign in'}).click();await page.getByLabel('Email address').fill(credentials.email);await page.getByLabel('Password',{exact:true}).fill(credentials.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Let’s book your day.'})).toBeVisible();
 await page.evaluate(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>Promise.reject(new DOMException('denied','NotAllowedError')),configurable:true});});await page.getByLabel('I agree to process this recording').check();await page.getByRole('button',{name:'Start recording'}).click();await expect(page.getByRole('alert')).toContainText('Microphone access was denied');await expect(page.getByText('Upload audio',{exact:true})).toBeVisible();
 // Real-mode request is never silently replaced by a fixture.
 const b=Buffer.alloc(44+32000);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(32000,40);
 const res=await page.request.post('/api/voice',{headers:{Origin:'http://localhost:3100'},multipart:{mode:'live',consent:'true',language:'en-NG',requestKey:unique(),audio:{name:'test.wav',mimeType:'audio/wav',buffer:b}}});expect(res.status()).toBe(503);expect((await res.json()).error).toContain('not connected');
 await page.getByRole('button',{name:'Manual entry',exact:true}).click();await expect(page.getByRole('heading',{name:'Review your business record'})).toBeVisible();await page.getByLabel('Kind of record').focus();await page.keyboard.press('Tab');await expect(page.getByLabel('Item or description')).toBeFocused();
});
test('merchant isolation, private files, report revocation and cross-origin protection',async({browser})=>{
 const first=await browser.newContext({baseURL:'http://localhost:3100'});const second=await browser.newContext({baseURL:'http://localhost:3100'});await register(first.request);await register(second.request);
 const headers={Origin:'http://localhost:3100'};const candidate={type:'SALE',item:'Private rice',quantity:null,unit:null,unitPrice:null,total:'100',currency:'NGN',eventDate:'2026-10-09',counterparty:'Private alias',paymentState:'unpaid',amountPaid:null,outstandingAmount:null,debtActivityId:null,source:'manual',unresolvedFields:[]};
 const draft=await (await first.request.post('/api/actions',{headers,data:{action:'draft',candidate,requestKey:unique()}})).json();const forbidden=await second.request.post('/api/actions',{headers,data:{action:'confirm',id:draft.id,version:1,confirmed:true}});expect(forbidden.status()).toBe(404);
 const record=await (await first.request.post('/api/actions',{headers,data:{action:'confirm',id:draft.id,version:1,confirmed:true}})).json();const file=await (await first.request.post('/api/evidence',{headers,multipart:{activityId:record.id,file:{name:'receipt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nsynthetic test only')}}})).json();
 expect((await first.request.get(`/api/evidence?id=${file.id}`)).status()).toBe(200);expect((await second.request.get(`/api/evidence?id=${file.id}`)).status()).toBe(404);
 const share=await (await first.request.post('/api/actions',{headers,data:{action:'share',from:'2026-10-09',to:'2026-10-09',hours:1,confirmed:true}})).json();expect((await second.request.post('/api/actions',{headers,data:{action:'revoke',id:share.id}})).status()).toBe(404);
 expect((await second.request.post('/api/actions',{headers:{Origin:'https://untrusted.example'},data:{action:'query',text:'today sales'}})).status()).toBe(403);
 const secondWorkspace=await (await second.request.get('/api/workspace')).json();expect(secondWorkspace.activities).toHaveLength(0);
 await first.close();await second.close();
});
test('desktop screen and denied network retry keep the same draft',async({page})=>{
 await register(page.request);await page.goto('/');await page.screenshot({path:'test-results/desktop-record.png',fullPage:true});await page.getByRole('button',{name:'Manual entry',exact:true}).click();await page.getByLabel('Kind of record').selectOption('SALE');await page.getByLabel('Item or description').fill('Tomatoes');await page.getByLabel('Total amount (₦)',{exact:true}).fill('8500');await page.getByLabel('Payment status').selectOption('paid');await page.getByRole('button',{name:'Update draft & read back'}).click();await page.getByLabel('I have checked this version.').check();
 await page.route('**/api/actions',route=>route.abort(),{times:1});await page.getByRole('button',{name:'Confirm & save record'}).click();await expect(page.getByRole('alert')).toContainText('Connection lost');await page.getByRole('button',{name:'Confirm & save record'}).click();await expect(page.getByText('Record confirmed and saved.')).toBeVisible();const workspace=await (await page.request.get('/api/workspace')).json();expect(workspace.activities).toHaveLength(1);
});
