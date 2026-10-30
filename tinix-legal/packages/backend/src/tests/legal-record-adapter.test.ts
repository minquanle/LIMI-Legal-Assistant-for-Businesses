import { describe,it,expect } from 'vitest';
import { canonicalJson,snapshotHashes,prepareParse,provisionText } from '../modules/legal/record-adapter.js';
import { normalizeSourceUrl,sourceSiteForDomain } from '@tinix-legal/shared/dist/source-identity.js';
const record={fullText:'Nội dung luật 😀',documentNumber:'1/2026/QĐ-UBND',signer:null,effectiveDate:null,validityStatus:'KHONG_XAC_DINH'};
describe('B2 legal identity, metadata and parsing',()=>{
  it('canonicalizes key order and excludes operational timestamps, paths and parser version from metadata hashes',()=>{
    const first=snapshotHashes(record);
    const second=snapshotHashes({...record,parsedAt:'2026-10-12T00:00:00Z',crawledAt:'2026-10-11T00:00:00Z',parserVersion:'new',localPath:'D:/other/file'});
    expect(first).toEqual(second); expect(first.metadataJson.signer).toBeNull(); expect(first.metadataJson.effectiveDate).toBeNull();
    expect(snapshotHashes({...record,effectiveDate:'2026-11-01'}).metadataHash).not.toBe(first.metadataHash);
    expect(canonicalJson({b:null,a:false})).toBe(canonicalJson({a:false,b:null}));
  });
  it('rejects invalid text, incorrect advertised hash and nonexistent dates',()=>{
    expect(()=>snapshotHashes({...record,fullText:'Error!'})).toThrow('INVALID_FULL_TEXT');
    expect(()=>snapshotHashes({...record,fullTextSha256:'0'.repeat(64)})).toThrow('CONTENT_HASH_MISMATCH');
    expect(()=>snapshotHashes({...record,effectiveDate:'2026-02-30'})).toThrow('INVALID_DATE');
  });
  it('keeps docid/ItemID and separates local sources without trusting lookalike domains',()=>{
    const a=normalizeSourceUrl('https://VBPL.vn/Pages/x.aspx?ItemID=1&utm_source=demo#dieu1');
    expect(a.normalizedUrl).toBe('https://vbpl.vn/Pages/x.aspx?ItemID=1');
    expect(normalizeSourceUrl('https://vbpl.vn/Pages/x.aspx?ItemID=2').normalizedUrl).not.toBe(a.normalizedUrl);
    expect(normalizeSourceUrl('https://vanban.chinhphu.vn/?docid=123').site).toBe('CHINHPHU');
    expect(normalizeSourceUrl('https://congbao.hungyen.gov.vn/a').site).toBe('HUNG_YEN');
    expect(normalizeSourceUrl('https://hdnd.hungyen.gov.vn/a').site).toBe('HUNG_YEN');
    expect(sourceSiteForDomain('vbpl.vn.evil.example')).toBe('OTHER');
    expect(sourceSiteForDomain('')).toBe('OTHER');
    expect(()=>normalizeSourceUrl('file:///C:/data')).toThrow('INVALID_SOURCE_URL');
  });
  it('preserves repeated ordinals and quoted IDs, derives content with Unicode code-point spans',()=>{
    const structure={offsetUnit:'UNICODE_CODE_POINT',sections:[],appendices:[],articles:[
      {id:'article-main-1',nodeType:'DIEU',ordinal:'1',content:'😀a',span:{start:0,end:2}},
      {id:'article-quoted-1',nodeType:'DIEU',ordinal:'1',content:'b',span:{start:2,end:3},quotedAmendmentCandidate:true}
    ]};
    const parsed=prepareParse('😀ab',structure);
    expect(parsed.provisions.map(p=>p.externalNodeId)).toEqual(['article-main-1','article-quoted-1']);
    expect(parsed.provisions[1].quotedAmendmentCandidate).toBe(true);
    expect(provisionText('😀ab',0,2)).toBe('😀a');
    expect(JSON.stringify(parsed.structureJson)).not.toContain('"content"');
    expect(()=>prepareParse('ab',structure)).toThrow('SPAN_OUT_OF_RANGE');
  });
  it('rejects duplicate node IDs, wrong offset units and child spans outside their parent',()=>{
    const root={id:'a',nodeType:'DIEU',span:{start:0,end:2}};
    const s={offsetUnit:'UNICODE_CODE_POINT',sections:[],appendices:[],articles:[root,root]};
    expect(()=>prepareParse('abc',s)).toThrow('INVALID_OR_DUPLICATE_NODE_ID');
    expect(()=>prepareParse('abc',{...s,offsetUnit:'UTF16'})).toThrow('UNSUPPORTED_OFFSET_UNIT');
    expect(()=>prepareParse('abc',{...s,articles:[{...root,children:[{id:'b',nodeType:'KHOAN',span:{start:1,end:3}}]}]})).toThrow('SPAN_OUT_OF_RANGE');
  });
});
