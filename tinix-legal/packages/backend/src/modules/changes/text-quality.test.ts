import {describe,it,expect} from 'vitest';
import {readableReviewText} from './text-quality.js';
describe('review text quality',()=>{
 it('rejects empty and keyboard test strings',()=>{for(const s of ['', 'sdfasdfasdfasdf', 'ádasdsadsad', 'abc abc abc', '...'])expect(readableReviewText(s)).toBe(false);});
 it('accepts readable Vietnamese without claiming legal correctness',()=>{expect(readableReviewText('Doanh nghiệp cần rà soát lại hồ sơ thuế.')).toBe(true);});
});
