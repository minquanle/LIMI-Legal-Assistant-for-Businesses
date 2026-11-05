// Business registry lookup (VietQR / CASSO). The provider rate-limits shared datacenter addresses,
// so the API retries once, reuses recent server-side results and tells the browser when it may
// query the provider directly from the user's own connection instead.
export const REGISTRY_SOURCE={provider:'VietQR / CASSO',url:'https://vietqr.io/danh-sach-api/tax-id-lookup/'} as const;
export const REGISTRY_CACHE_MS=30*24*3600*1000;

export type RegistryProfile={taxId:string;name:string;shortName:string;internationalName:string;address:string;status:string};
export type RegistryOutcome=
  |{ok:true;profile:RegistryProfile;provenance:Record<string,unknown>}
  |{ok:false;status:number;code:'REGISTRY_NOT_FOUND'|'REGISTRY_RATE_LIMITED'|'REGISTRY_UNAVAILABLE'};

const text=(v:unknown)=>typeof v==='string'?v.trim().slice(0,2000):'';
const normalize=(v:unknown)=>{const s=String(v??'').replace(/\s/g,'');if(!/^\d{10}(?:-?\d{3})?$/.test(s))return null;const d=s.replace('-','');return d.length===13?`${d.slice(0,10)}-${d.slice(10)}`:d;};
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

/** Profile fields a browser-side lookup may submit; nothing else from the client is stored. */
export function registryProfileFromBrowser(id:string,input:Record<string,unknown>):RegistryProfile|null{
  const profile={taxId:id,name:text(input.name),shortName:text(input.shortName),internationalName:text(input.internationalName),address:text(input.address),status:text(input.status)};
  return profile.name?profile:null;
}

export async function lookupRegistry(id:string,{fetchImpl=fetch,timeoutMs=5000,retryDelayMs=1200,now=()=>new Date()}:{fetchImpl?:typeof fetch;timeoutMs?:number;retryDelayMs?:number;now?:()=>Date}={}):Promise<RegistryOutcome>{
  let last:RegistryOutcome={ok:false,status:503,code:'REGISTRY_UNAVAILABLE'};
  // Two attempts at most: the Next gateway gives the whole request 15 seconds.
  for(let attempt=0;attempt<2;attempt++){
    if(attempt)await wait(retryDelayMs);
    let response:Response;
    try{response=await fetchImpl(`https://api.vietqr.io/v2/business/${encodeURIComponent(id)}`,{headers:{Accept:'application/json','User-Agent':'LIMI/1.0 (+https://limi-web.onrender.com)'},signal:AbortSignal.timeout(timeoutMs)});}
    catch{last={ok:false,status:503,code:'REGISTRY_UNAVAILABLE'};continue;}
    if(response.status===429){last={ok:false,status:503,code:'REGISTRY_RATE_LIMITED'};continue;}
    if(response.status>=500){last={ok:false,status:503,code:'REGISTRY_UNAVAILABLE'};continue;}
    if(!response.ok)return {ok:false,status:503,code:'REGISTRY_UNAVAILABLE'};
    let payload:any;try{payload=await response.json();}catch{return {ok:false,status:503,code:'REGISTRY_UNAVAILABLE'};}
    const data=payload?.data;
    // The provider answers HTTP 200 with a non-"00" code when it has no record for the number.
    if(payload?.code!=='00'||!data||!text(data.name))return {ok:false,status:404,code:'REGISTRY_NOT_FOUND'};
    if(normalize(data.id)!==id)return {ok:false,status:503,code:'REGISTRY_UNAVAILABLE'};
    return {ok:true,profile:{taxId:id,name:text(data.name),shortName:text(data.shortName),internationalName:text(data.internationalName),address:text(data.address),status:text(data.status)},
      provenance:{...REGISTRY_SOURCE,retrievedAt:now().toISOString(),sourceUpdatedAt:text(payload?.metadata?.updatedAt)||undefined,verified:false,channel:'server'}};
  }
  return last;
}
