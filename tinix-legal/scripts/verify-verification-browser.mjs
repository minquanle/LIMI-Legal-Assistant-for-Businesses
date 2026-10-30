import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch({headless:true,channel:'msedge'}),out=new URL('../../outputs/LIMI_VERIFICATION_57_20261026/',import.meta.url);await mkdir(out,{recursive:true});
let inspected;const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();inspected=page;let answers=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/answers'))answers++;});
 await page.goto('http://127.0.0.1:3002/workspace?view=account');await page.locator('#product-auth [name=email]').fill('owner@compliance.test');await page.locator('#product-auth [name=password]').fill(process.env.COMPLIANCE_TEST_PASSWORD);await page.locator('#product-auth .primary-button').click();
 await page.locator('.side-nav [data-nav=checklist]').waitFor();await page.goto('http://127.0.0.1:3002/workspace?view=checklist&company='+process.env.COMPLIANCE_TEST_COMPANY_ID);await page.getByRole('heading',{name:'Công việc tuân thủ',exact:true}).waitFor();
 async function open(title){const card=page.locator('.task-card').filter({has:page.getByRole('heading',{name:title,exact:true})});await page.locator('[data-compliance=filter][data-id=all]').waitFor();if(!await card.count()){await page.locator('[data-compliance=filter][data-id=all]').click();}await card.locator('[data-compliance=task]').click();}
 await open('Inline browser bonus fixture');await page.locator('#compliance-answer').waitFor();
 assert.match(await page.locator('.scope-known').innerText(),/10–49 nhân viên/);assert.equal(await page.locator('#compliance-answer legend').count(),1);
 assert.equal(await page.locator('#compliance-task').count(),0);assert.equal(await page.locator('#compliance-answer').getByRole('button',{name:'Có',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'Chưa rõ',exact:true}).click();assert.equal(answers,0);assert.equal(await page.locator('#compliance-answer').count(),1);
 await page.screenshot({path:fileURLToPath(new URL('verification-desktop.png',out)),fullPage:false});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:fileURLToPath(new URL('verification-mobile.png',out)),fullPage:false});
 await page.locator('#compliance-answer').getByRole('button',{name:'Có',exact:true}).click();await page.locator('#compliance-task').waitFor();assert.equal(answers,1);assert.equal(await page.locator('#compliance-answer').count(),0);
 await page.screenshot({path:fileURLToPath(new URL('verification-to-checklist.png',out)),fullPage:false});
 await page.locator('[data-compliance=back]').click();await page.setViewportSize({width:1440,height:1000});
 await open('Inline browser shared bonus fixture');await page.locator('#compliance-task').waitFor();assert.equal(await page.locator('#compliance-answer').count(),0);await page.locator('[data-compliance=back]').click();
 await page.reload();await page.getByRole('heading',{name:'Công việc tuân thủ',exact:true}).waitFor();
 await open('Inline browser bonus fixture');await page.locator('#compliance-task').waitFor();await page.locator('[data-compliance=back]').click();
 await open('Inline browser negative fixture');await page.locator('#compliance-answer').waitFor();await page.locator('#compliance-answer').getByRole('button',{name:'Không',exact:true}).click();await page.locator('#compliance-answer').waitFor({state:'detached'});await page.locator('.detail-sheet').waitFor({state:'detached'});assert.equal(answers,2);assert.deepEqual(errors,[]);
 const result={status:'passed',singleQuestion:true,reusesWorkforceRange:true,unknownMakesNoMutation:true,yesOpensChecklist:true,sharedAnswersPersist:true,reloadPersists:true,noRemovesFromPending:true,mobileNoOverflow:true,pageErrors:errors};await writeFile(new URL('browser-tests.json',out),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(e){if(inspected){await writeFile(new URL('browser-failure.json',out),JSON.stringify({errors,body:await inspected.locator('body').innerText()},null,2));await inspected.screenshot({path:fileURLToPath(new URL('browser-failure.png',out))});}throw e;}finally{await browser.close();}
