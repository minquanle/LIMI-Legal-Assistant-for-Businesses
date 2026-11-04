import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alerts, samples } from '../dist/data.js';
import { buildTasks } from '../dist/rules.js';
import { legalDocuments, getTaskGuide } from '../dist/legal.js';
import { daysUntil, countdownLabel, alertPhase, alertMilestones } from '../dist/alert-time.js';

// The selectable demo accounts intentionally start with no activity ticked.
// Keep complete profiles here so alert rules are still tested against explicit facts.
const demoProfiles = {
  'DEMO-001': { ...samples['DEMO-001'], stage: 'new', employees: '1-9', activity: ['digital'], channels: ['marketplace', 'website'], places: ['office'], signals: ['invoice', 'customerData', 'smallEnterprise', 'copyrightAssets', 'digitalPublishing'], topics: ['tax', 'company', 'commerce', 'data'], role: 'owner' },
  'DEMO-002': { ...samples['DEMO-002'], stage: 'running', employees: '10-49', activity: ['services'], channels: ['direct', 'website'], places: ['office', 'warehouse'], signals: ['invoice', 'customerData', 'smallEnterprise', 'copyrightAssets', 'notary'], topics: ['tax', 'labor', 'company', 'commerce', 'fire'], role: 'accountant' },
};

test('real early-warning alert has source, dates and targeted profile signal', () => {
  const alert = alerts.find(item => item.id === 'notary-law-2027');
  assert.ok(alert);
  assert.equal(alert.sourceCode, '04/2026/QH16');
  assert.equal(alert.effectiveDate, '2027-01-01');
  assert.ok(legalDocuments.some(doc => doc.code === alert.sourceCode && doc.url === alert.sourceUrl));
  assert.equal(alert.test(demoProfiles['DEMO-001']), false);
  assert.equal(alert.test(demoProfiles['DEMO-002']), true);
});

test('wage sanctions alert uses affected workers, organization multiplier and a detailed remedial checklist', () => {
  const alert = alerts.find(item => item.id === 'wage-sanctions-2026');
  assert.ok(alert);
  assert.equal(alert.kind, 'effective');
  assert.equal(alert.sourceCode, '283/2026/NĐ-CP');
  assert.equal(alert.effectiveDate, '2026-09-10');
  assert.equal(alert.test(demoProfiles['DEMO-001']), true);
  assert.equal(alert.test(demoProfiles['DEMO-002']), true);
  assert.equal(buildTasks(demoProfiles['DEMO-002']).some(task => task.id === alert.task.id), false);
  const task = buildTasks(demoProfiles['DEMO-002'], {}, [alert.id]).find(item => item.id === alert.task.id);
  const guide = getTaskGuide(task);
  assert.equal(guide.steps.length, 14);
  assert.match(alert.changes.join(' '), /số người lao động bị vi phạm/);
  assert.match(alert.changes.join(' '), /gấp 02 lần/);
  assert.ok(guide.steps.some(step => /không dùng tổng headcount/i.test(step.detail)));
  assert.ok(guide.steps.some(step => /tiền lãi/i.test(step.title + step.detail)));
});

test('tax opportunity uses the legal request deadline and produces a detailed checklist only after applying', () => {
  const alert = alerts.find(item => item.id === 'tax-extension-2026');
  assert.ok(alert);
  assert.equal(alert.kind, 'opportunity');
  assert.equal(alert.deadlineDate, '2026-11-02');
  assert.equal(alert.test(demoProfiles['DEMO-001']), true);
  assert.equal(alert.test(demoProfiles['DEMO-002']), true);
  assert.equal(buildTasks(demoProfiles['DEMO-002']).some(task => task.id === alert.task.id), false);
  const task = buildTasks(demoProfiles['DEMO-002'], {}, [alert.id]).find(item => item.id === alert.task.id);
  assert.equal(getTaskGuide(task).steps.length, 9);
  assert.equal(getTaskGuide(task).timing.includes('02/11/2026'), true);
});

test('copyright enforcement is not presented as a new effective-date countdown', () => {
  const alert = alerts.find(item => item.id === 'copyright-enforcement-2026');
  assert.ok(alert);
  assert.equal(alert.kind, 'enforcement');
  assert.equal(alert.effectiveDate, undefined);
  assert.equal(alert.test(demoProfiles['DEMO-002']), true);
  const task = buildTasks(demoProfiles['DEMO-002'], {}, [alert.id]).find(item => item.id === alert.task.id);
  const guide = getTaskGuide(task);
  assert.equal(guide.steps.length, 8);
  assert.match(guide.timing, /Không có ngày hiệu lực mới/);
});

test('publishing-law alert is restricted to the digital publishing profile', () => {
  const alert = alerts.find(item => item.id === 'publishing-law-2027');
  assert.ok(alert);
  assert.equal(alert.effectiveDate, '2027-03-01');
  assert.equal(alert.test(demoProfiles['DEMO-001']), true);
  assert.equal(alert.test(demoProfiles['DEMO-002']), false);
  const task = buildTasks(demoProfiles['DEMO-001'], {}, [alert.id]).find(item => item.id === alert.task.id);
  assert.equal(getTaskGuide(task).steps.length, 8);
});

test('pre-authored five-point guide appears only after applying a relevant alert', () => {
  const profile = demoProfiles['DEMO-002'];
  assert.equal(buildTasks(profile).some(task => task.id === 'notary-2027-review'), false);
  const task = buildTasks(profile, {}, ['notary-law-2027']).find(item => item.id === 'notary-2027-review');
  assert.ok(task);
  const guide = getTaskGuide(task);
  assert.equal(guide.steps.length, 5);
  assert.deepEqual(guide.basis, ['notary-amendment-2026']);
  assert.ok(guide.steps.every(step => step.title && step.detail && step.evidence && step.refs.length));
});

test('countdown is based on calendar days, including the effective-day boundary', () => {
  assert.equal(daysUntil('2027-01-01', new Date(2026, 11, 31, 23, 59)), 1);
  assert.equal(countdownLabel('2027-01-01', new Date(2027, 0, 1, 12, 0)), 'hiệu lực hôm nay');
  assert.equal(countdownLabel('2027-01-01', new Date(2027, 0, 2, 0, 1)), 'đã hiệu lực 1 ngày');
  assert.equal(alertPhase('2027-01-01', new Date(2026, 8, 18)), 'Theo dõi sớm');
  assert.equal(alertPhase('2027-01-01', new Date(2026, 11, 20)), 'Sắp có hiệu lực');
  assert.deepEqual(alertMilestones('2027-01-01', new Date(2026, 8, 18)).map(item => item.date), ['2026-10-03', '2026-12-02', '2026-12-25', '2027-01-01']);
});
