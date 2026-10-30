import { afterAll,describe,expect,it } from 'vitest';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { readRecords } from '../modules/legal/import-input.js';
import { publicProvenance } from '../modules/legal/curated-record.mapper.js';
const root=await mkdtemp(join(tmpdir(),'limi-input-test-'));
afterAll(async()=>{if(!root.startsWith(join(tmpdir(),'limi-input-test-')))throw new Error('UNSAFE_TEST_PATH');await rm(root,{recursive:true,force:true});});
describe('curated import stream and public DTO boundary',()=>{
  it('keeps record indexes contiguous around rejected JSONL and skips whitespace',async()=>{const path=join(root,'lines.jsonl');await writeFile(path,'{"id":"a"}\n\nINVALID\n{"id":"b"}\n');
    const result=[];for await(const item of readRecords(path))result.push(item);expect(result.map(r=>r.index)).toEqual([0,1,2]);expect(result[1].error).toBe('INVALID_JSON');expect(result[2].value).toEqual({id:'b'});});
  it('streams JSON array and both gzip formats with the same records',async()=>{for(const format of ['json','json.gz','jsonl.gz']){
    const path=join(root,`batch.${format}`),text=format.startsWith('jsonl')?'{"id":"a"}\n{"id":"b"}':JSON.stringify([{id:'a'},{id:'b'}]);await writeFile(path,format.endsWith('.gz')?gzipSync(text):text);
    const items=[];for await(const item of readRecords(path))items.push(item.value);expect(items).toEqual([{id:'a'},{id:'b'}]);}});
  it('removes nested private paths and credentials while preserving dates and source hashes',()=>{const value=publicProvenance({url:'https://vbpl.vn/?ItemID=1',sha256:'a'.repeat(64),createdAt:new Date('2026-10-12T00:00:00Z'),source:{candidatePath:'C:/private/file',archiveLocalPath:'C:/archive',localPath:'C:/raw',objectKey:'private/key',secretKey:'secret',accessToken:'token',kind:'BATCH'}});
    expect(value).toEqual({url:'https://vbpl.vn/?ItemID=1',sha256:'a'.repeat(64),createdAt:'2026-10-12T00:00:00.000Z',source:{kind:'BATCH'}});});
});
