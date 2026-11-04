import {describe,expect,it} from 'vitest';
import {lookupRegistry,registryProfileFromBrowser} from './registry.js';

const reply=(status:number,body?:unknown)=>new Response(body===undefined?'':JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const fake=(...responses:(Response|Error)[])=>{const calls:string[]=[];const impl=(async(url:string)=>{calls.push(url);const next=responses.shift();if(!next)throw new Error('no response');if(next instanceof Error)throw next;return next;}) as unknown as typeof fetch;return {impl,calls};};
const found={code:'00',data:{id:'0101248141',name:' CÔNG TY CỔ PHẦN FPT ',internationalName:'FPT CORPORATION',shortName:'FPT CORP',address:'Hà Nội',status:'NNT đang hoạt động'}};

describe('lookupRegistry',()=>{
  it('maps a provider record to a trimmed profile with server provenance',async()=>{
    const {impl}=fake(reply(200,found));
    const out=await lookupRegistry('0101248141',{fetchImpl:impl,retryDelayMs:0,now:()=>new Date('2026-11-04T00:00:00Z')});
    expect(out).toMatchObject({ok:true,profile:{taxId:'0101248141',name:'CÔNG TY CỔ PHẦN FPT',shortName:'FPT CORP'},provenance:{provider:'VietQR / CASSO',channel:'server',verified:false,retrievedAt:'2026-11-04T00:00:00.000Z'}});
  });
  it('retries once after a rate limit and succeeds',async()=>{
    const {impl,calls}=fake(reply(429),reply(200,found));
    expect((await lookupRegistry('0101248141',{fetchImpl:impl,retryDelayMs:0})).ok).toBe(true);
    expect(calls).toHaveLength(2);
  });
  it('reports a persistent rate limit separately so the browser can try',async()=>{
    const {impl,calls}=fake(reply(429),reply(429));
    expect(await lookupRegistry('0101248141',{fetchImpl:impl,retryDelayMs:0})).toEqual({ok:false,status:503,code:'REGISTRY_RATE_LIMITED'});
    expect(calls).toHaveLength(2);
  });
  it('treats a non-00 provider code as not found, without retrying',async()=>{
    const {impl,calls}=fake(reply(200,{code:'52',desc:'not found',data:null}));
    expect(await lookupRegistry('0101248141',{fetchImpl:impl,retryDelayMs:0})).toEqual({ok:false,status:404,code:'REGISTRY_NOT_FOUND'});
    expect(calls).toHaveLength(1);
  });
  it('rejects a record for a different tax id',async()=>{
    const {impl}=fake(reply(200,{...found,data:{...found.data,id:'0100109106'}}));
    expect(await lookupRegistry('0101248141',{fetchImpl:impl,retryDelayMs:0})).toMatchObject({ok:false,code:'REGISTRY_UNAVAILABLE'});
  });
  it('treats network errors and server errors as unavailable',async()=>{
    const {impl}=fake(new Error('reset'),reply(502));
    expect(await lookupRegistry('0101248141',{fetchImpl:impl,retryDelayMs:0})).toEqual({ok:false,status:503,code:'REGISTRY_UNAVAILABLE'});
  });
  it('keeps the 13-digit branch format when comparing ids',async()=>{
    const {impl}=fake(reply(200,{code:'00',data:{id:'0101248141001',name:'Chi nhánh'}}));
    expect((await lookupRegistry('0101248141-001',{fetchImpl:impl,retryDelayMs:0})).ok).toBe(true);
  });
});

describe('registryProfileFromBrowser',()=>{
  it('keeps only known fields and requires a name',()=>{
    expect(registryProfileFromBrowser('0101248141',{name:'  A ',address:'B',extra:'x'})).toEqual({taxId:'0101248141',name:'A',shortName:'',internationalName:'',address:'B',status:''});
    expect(registryProfileFromBrowser('0101248141',{name:'  '})).toBeNull();
  });
});
