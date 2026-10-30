import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTaxId, lookupBusiness, emptyBusiness } from '../dist/business.js';
import { buildTasks, compareTasksForAttention } from '../dist/rules.js';

test('MST keeps leading zeros and normalizes dependent-unit separators', () => {
  assert.equal(normalizeTaxId(' 0316794479 '), '0316794479');
  assert.equal(normalizeTaxId('0316794479001'), '0316794479-001');
  assert.equal(normalizeTaxId('0316794479-001'), '0316794479-001');
  for (const value of ['DEMO-001', '123', '0316794479x', '0316794479--001', '0316794479/001']) assert.equal(normalizeTaxId(value), null);
});

test('live fields retain provenance without inventing activity or registration details', async t => {
  let requestedUrl;
  t.mock.method(globalThis, 'fetch', async url => {
    requestedUrl = url;
    return new Response(JSON.stringify({code:'00',data:{id:'0316794479',name:'CÔNG TY TNHH CASSO',address:'Địa chỉ từ nguồn',status:'NNT đang hoạt động'},metadata:{updatedAt:'2026-09-17T10:00:00.000Z'}}));
  });
  const result = await lookupBusiness('0316794479');
  assert.equal(requestedUrl, 'https://api.vietqr.io/v2/business/0316794479');
  assert.equal(result.sourceKind, 'live');
  assert.equal(result.name, 'CÔNG TY TNHH CASSO');
  assert.equal(result.sourceUpdatedAt, '2026-09-17T10:00:00.000Z');
  assert.ok(Number.isFinite(Date.parse(result.retrievedAt)));
  for(const field of ['type','founded','registered','internationalName','shortName','stage']) assert.equal(result[field], '');
  assert.equal(result.employees, 'unknown');
  assert.deepEqual(result.signals, []);
});

test('a response for a different entity is never accepted', async t => {
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({code:'00',data:{id:'0101248141',name:'Another company'}})));
  await assert.rejects(lookupBusiness('0316794479'), /không khớp/);
});

test('not found stays an error, never becomes a sample company', async t => {
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({code:'01',data:null})));
  await assert.rejects(lookupBusiness('0000000000'), /Không tìm thấy/);
});

test('rate limiting and upstream failures have actionable messages', async t => {
  const fetch=t.mock.method(globalThis,'fetch',async()=>new Response('',{status:429}));
  await assert.rejects(lookupBusiness('0316794479'), /giới hạn/);
  fetch.mock.mockImplementation(async()=>new Response('',{status:503}));
  await assert.rejects(lookupBusiness('0316794479'), /tạm thời/);
});

test('invalid tax identifiers do not make network requests', async t => {
  const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new Error('Network should not be called')});
  await assert.rejects(lookupBusiness('invalid'),/10 số/);
  assert.equal(fetch.mock.callCount(),0);
});

test('cancellation is passed to fetch for timeout and stale-request protection', async t => {
  const controller=new AbortController();
  controller.abort();
  t.mock.method(globalThis,'fetch',async(_url,options)=>{assert.equal(options.signal,controller.signal);options.signal.throwIfAborted()});
  await assert.rejects(lookupBusiness('0316794479',{signal:controller.signal}),{name:'AbortError'});
});

test('unknown workforce creates a verification task instead of assuming employees', () => {
  const profile=emptyBusiness();
  const unknown=buildTasks(profile).map(t=>t.id);
  assert.ok(unknown.includes('labor-profile'));
  assert.ok(!unknown.includes('labor-contracts'));
  const zero=buildTasks({...profile,employees:'0'}).map(t=>t.id);
  assert.ok(!zero.includes('labor-profile'));
  assert.ok(!zero.includes('labor-contracts'));
  const present=buildTasks({...profile,employees:'10-49'}).map(t=>t.id);
  assert.ok(present.includes('labor-contracts'));
  assert.ok(present.includes('labor-rules'));
});

test('action status outranks interest topics when tasks are ordered', () => {
  const ordered = [
    { title: 'Việc xác minh đúng chủ đề', status: 'verify', priority: 'high', category: 'tax' },
    { title: 'Việc đã xác nhận cần xử lý', status: 'todo', priority: 'normal', category: 'company' },
  ].sort((a, b) => compareTasksForAttention(a, b, ['tax']));
  assert.equal(ordered[0].status, 'todo');
});
