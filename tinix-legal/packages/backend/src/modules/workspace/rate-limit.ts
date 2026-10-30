// In-memory sliding-window limiter for auth endpoints (single API instance).
// Requests arrive through the Next gateway, so the client IP is not reliable here:
// login is limited per email, registration per email and by a global hourly budget.
export function createLimiter(limit:number,windowMs:number,now:()=>number=Date.now){
 const hits=new Map<string,number[]>();
 return {
  /** true when the key is still under its limit; records the attempt either way */
  take(key:string){const t=now(),list=(hits.get(key)??[]).filter(x=>t-x<windowMs);list.push(t);hits.set(key,list);if(hits.size>10000)for(const [k,v] of hits)if(!v.some(x=>t-x<windowMs))hits.delete(k);return list.length<=limit;},
  reset(key:string){hits.delete(key);}
 };
}
