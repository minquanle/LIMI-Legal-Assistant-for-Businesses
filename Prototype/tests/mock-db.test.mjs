import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legalAnalyses, checklistTemplates, templateMatch } from '../dist/mock-db.js';
import { legalDocuments, getTaskGuide, taskGuides } from '../dist/legal.js';
import { buildTasks } from '../dist/rules.js';
import { samples } from '../dist/data.js';

const demoProfiles = {
  'DEMO-001': { ...samples['DEMO-001'], stage: 'new', employees: '1-9', activity: ['digital'], channels: ['marketplace', 'website'], places: ['office'], signals: ['invoice', 'customerData', 'smallEnterprise', 'copyrightAssets', 'digitalPublishing'], topics: ['tax', 'company', 'commerce', 'data'], role: 'owner' },
  'DEMO-002': { ...samples['DEMO-002'], stage: 'running', employees: '10-49', activity: ['services'], channels: ['direct', 'website'], places: ['office', 'warehouse'], signals: ['invoice', 'customerData', 'smallEnterprise', 'copyrightAssets', 'notary'], topics: ['tax', 'labor', 'company', 'commerce', 'fire'], role: 'accountant' },
};

test('current sources, superseded sources and detailed checklists retain clause-level lineage', () => {
  assert.equal(legalAnalyses.length, 14);
  assert.equal(checklistTemplates.length, 10);
  const sourceIds = new Set(legalDocuments.map(doc => doc.id));
  const templateIds = new Set(checklistTemplates.map(template => template.id));
  assert.equal(sourceIds.size, 14);
  assert.equal(templateIds.size, 10);
  assert.equal(legalAnalyses.filter(analysis => analysis.status === 'current').length, 12);
  for (const analysis of legalAnalyses) {
    assert.ok(sourceIds.has(analysis.sourceId));
    assert.ok(analysis.importantPoint && analysis.affectedGroups.length && analysis.findings.length);
    for (const id of analysis.templateIds) assert.ok(templateIds.has(id));
    for (const item of analysis.findings) {
      assert.ok(item.clause && item.importantPoint && item.affectedGroups.length && item.conditionLabel);
      for (const id of item.templateIds) assert.ok(templateIds.has(id));
    }
    if (analysis.status === 'superseded') assert.deepEqual(analysis.templateIds, []);
  }
  for (const template of checklistTemplates) {
    assert.ok(template.sourceIds.length && template.guide.steps.length >= 5);
    for (const sourceId of template.sourceIds) {
      assert.ok(sourceIds.has(sourceId));
      assert.ok(legalAnalyses.find(analysis => analysis.sourceId === sourceId).templateIds.includes(template.id));
      assert.notEqual(legalDocuments.find(doc => doc.id === sourceId).status, 'superseded');
    }
    for (const step of template.guide.steps) {
      assert.ok(step.title && step.detail && step.evidence && step.refs.length);
      for (const ref of step.refs) {
        assert.ok(template.sourceIds.includes(ref.sourceId));
        assert.match(ref.clause, /(Điều|Mục|Khái niệm|Nghĩa vụ|Quyền) /);
      }
    }
    assert.deepEqual(getTaskGuide(template).basis, template.sourceIds);
  }
  assert.ok(checklistTemplates.reduce((sum, item) => sum + item.guide.steps.length, 0) >= 65);
  for (const id of ['wage-sanctions-2026', 'tax-extension-2026', 'copyright-enforcement-2026', 'publishing-law-2027']) {
    assert.ok(checklistTemplates.find(template => template.id === id).guide.steps.length >= 8);
  }
  assert.equal(checklistTemplates.find(template => template.id === 'notary-2027-review').guide.steps.length, 5);
});

test('one checklist task is reused when two current legal sources support it', () => {
  const profile = demoProfiles['DEMO-001'];
  const tasks = buildTasks(profile);
  for (const id of ['invoice-process', 'labor-contracts', 'marketplace', 'website-commerce', 'personal-data']) {
    assert.equal(tasks.filter(task => task.id === id).length, 1);
    assert.equal(tasks.find(task => task.id === id).origin, 'saved-template');
  }
  assert.equal(tasks.some(task => task.id === 'tax-extension-2026'), false);
  assert.deepEqual(checklistTemplates.find(template => template.id === 'invoice-process').sourceIds, ['invoice-254']);
});

test('profile conditions, not interest ticks, determine applicability', () => {
  const profile = { ...demoProfiles['DEMO-002'], topics: [] };
  const ids = buildTasks(profile).map(task => task.id);
  assert.ok(ids.includes('invoice-process'));
  assert.ok(ids.includes('labor-contracts'));
  assert.ok(ids.includes('website-commerce'));
  assert.ok(!ids.includes('marketplace'));
  const labor = checklistTemplates.find(template => template.id === 'labor-contracts');
  assert.equal(templateMatch({ ...profile, employees: '0' }, labor), 'no-match');
  assert.equal(templateMatch({ ...profile, employees: 'unknown' }, labor), 'unknown');
});

test('annual-leave payout review exposes the concrete employee and payment checks used in the demo', () => {
  const wage = checklistTemplates.find(template => template.id === 'wage-sanctions-2026');
  assert.ok(wage.guide.steps.every(step => step.checks.length >= 3), 'every wage review point should expose concrete subchecks');
  const annualLeave = wage.guide.steps.find(step => step.title.includes('nghỉ hằng năm'));
  const checks = annualLeave.checks.map(item => item.toLocaleLowerCase('vi'));
  assert.equal(annualLeave.checks.length, 6);
  assert.ok(checks.some(item => item.includes('danh sách người lao động')));
  assert.ok(checks.some(item => item.includes('số ngày nghỉ hằng năm')));
  assert.ok(checks.some(item => item.includes('bảng theo dõi phép năm')));
  assert.ok(checks.some(item => item.includes('quyết định thôi việc')));
  assert.ok(checks.some(item => item.includes('bảng quyết toán')));
  assert.ok(checks.some(item => item.includes('chứng từ trả tiền')));
});

test('every saved checklist exposes actionable subchecks and the copyright demo is fully authored', () => {
  for (const template of checklistTemplates) {
    assert.ok(template.guide.steps.every(step => Array.isArray(step.checks) && step.checks.length >= 3), `${template.id} has a checklist point without actionable subchecks`);
  }
  const copyright = checklistTemplates.find(template => template.id === 'copyright-enforcement-2026');
  const copyrightChecks = copyright.guide.steps.flatMap(step => step.checks).map(item => item.toLocaleLowerCase('vi'));
  assert.equal(copyright.guide.steps.length, 8);
  assert.ok(copyright.guide.steps.every(step => step.checks.length === 4));
  assert.ok(copyrightChecks.some(item => item.includes('tìm thấy trên internet')));
  assert.ok(copyrightChecks.some(item => item.includes('chạy thử')));
});

test('every base and fallback checklist uses a detailed guide with at least five review points', () => {
  for (const [id, guide] of Object.entries(taskGuides)) {
    assert.ok(guide.steps.length >= 5, `${id} still has fewer than five review points`);
    assert.ok(guide.steps.every(step => typeof step === 'object' && step.title && step.detail && step.evidence && Array.isArray(step.refs) && step.checks?.length >= 3), `${id} still uses the old or shallow step format`);
  }
  const unknownProfile = { ...demoProfiles['DEMO-001'], employees: 'unknown' };
  for (const task of buildTasks(unknownProfile)) {
    const guide = getTaskGuide(task);
    assert.ok(guide.steps.length >= 5, `${task.id} resolves to a shallow guide`);
    assert.ok(guide.steps.every(step => typeof step === 'object'));
  }
  const fallback = getTaskGuide({ id: 'future-unmapped-task', action: 'Rà soát', evidence: 'Bằng chứng' });
  assert.equal(fallback.steps.length, 5);
  assert.ok(fallback.steps.every(step => typeof step === 'object'));
});
