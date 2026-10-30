import {describe,it,expect} from 'vitest';
import {feedbackCreate,feedbackReply,feedbackReview,feedbackQuery} from './contracts.js';
const requestId='12345678-1234-4234-8234-123456789012';
describe('company feedback input',()=>{
 it('trims messages and rejects task/status mutations in reports',()=>{
  expect(feedbackCreate.parse({requestId,category:'UNCLEAR',body:'  Cần giải thích thêm  '}).body).toBe('Cần giải thích thêm');
  expect(()=>feedbackCreate.parse({requestId,category:'UNCLEAR',body:'x'})).toThrow();
  expect(()=>feedbackCreate.parse({requestId,category:'UNCLEAR',body:'Valid body',status:'RESOLVED'})).toThrow();
  expect(()=>feedbackCreate.parse({requestId,category:'UNCLEAR',body:'x'.repeat(4001)})).toThrow();
 });
 it('requires a reviewer explanation and revision; a company reply cannot set status',()=>{
  expect(()=>feedbackReview.parse({requestId,expectedRevision:1,status:'RESOLVED',body:''})).toThrow();
  expect(()=>feedbackReply.parse({requestId,expectedRevision:1,body:'Company message',status:'RESOLVED'})).toThrow();
  expect(feedbackReview.parse({requestId,expectedRevision:2,status:'IN_REVIEW',body:'LIMI đang kiểm tra.'}).status).toBe('IN_REVIEW');
 });
 it('bounds pagination and search input',()=>{
  expect(feedbackQuery.parse({}).page).toBe(0);expect(()=>feedbackQuery.parse({page:-1})).toThrow();expect(()=>feedbackQuery.parse({q:'x'.repeat(201)})).toThrow();
 });
});
