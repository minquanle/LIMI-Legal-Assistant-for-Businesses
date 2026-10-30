import {legalApiBase} from '@/lib/legal-api';
type Context={params:Promise<{path:string[]}>};
async function proxy(request:Request,{params}:Context){
  const {path}=await params,joined=path.join('/');
  const pilotPath=/^(companies\/[a-zA-Z0-9_-]{1,80}\/(checklist-preview|checklist-coverage|evaluations\/preview|pilot-checklist\/[a-zA-Z0-9_-]{1,80}(\/verify-scope)?)|admin\/(checklist-imports|checklist-coverage))$/.test(joined);
  if(!pilotPath&&!/^(auth\/(register|login|logout|me|activate|accept-invite|revoke-all)|companies(\/[a-zA-Z0-9_-]{1,80}(\/(profile|profiles|events|tasks|evaluations|dashboard|alerts|reminders|feedback|sites(\/[a-zA-Z0-9_-]{1,80})?))?)?|organizations\/[a-zA-Z0-9_-]{1,80}\/(members(\/[a-zA-Z0-9_-]{1,80})?|invites|audit)|registry\/[0-9-]{10,14}|alerts\/[a-zA-Z0-9_-]{1,80}(\/task)?|admin\/(law-discovery(\/run)?|feedback(\/[a-zA-Z0-9_-]{1,80}(\/messages)?)?|legal-sources|overview|changes(\/[a-zA-Z0-9_-]{1,80}(\/(approve|reject|route))?)?|watchset(\/[a-zA-Z0-9_-]{1,80})?|change-impacts\/[a-zA-Z0-9_-]{1,80}\/retry|candidates(\/[a-zA-Z0-9_-]{1,80}\/draft)?|obligations(\/[a-zA-Z0-9_-]{1,80}(\/(submit|review|new-version|retire))?)?|releases)|feedback\/[a-zA-Z0-9_-]{1,80}(\/messages)?|tasks\/[a-zA-Z0-9_-]{1,80}(\/(evidence\/init|adopt-basis|verify-scope|answers))?|evaluations\/[a-zA-Z0-9_-]{1,80}(\/retry)?|evidence\/[a-zA-Z0-9_-]{1,80}\/(upload|complete|retry|link|download))$/.test(joined))return Response.json({error:'NOT_FOUND'},{status:404});
  // Next may construct request.url with localhost behind its HTTP server. Compare
  // the browser Origin to the actual Host; the API independently checks its allowlist.
  if(request.method!=='GET'){
    try{const origin=new URL(request.headers.get('origin')??'');if(!['http:','https:'].includes(origin.protocol)||origin.host!==request.headers.get('host'))throw Error();}
    catch{return Response.json({error:'ORIGIN_REJECTED'},{status:403});}
  }
  const headers=new Headers({'Accept':'application/json'});
  for(const name of ['cookie','origin','content-type','x-csrf-token','x-upload-token']){const value=request.headers.get(name);if(value)headers.set(name,value);}
  try{
    const binary=joined.endsWith('/upload'),max=binary?10*1024*1024:joined==='admin/legal-sources'?1000000:100000;
    if(Number(request.headers.get('content-length')||0)>max)return Response.json({error:'INVALID_REQUEST'},{status:413});
    const body=request.method==='GET'?undefined:new Uint8Array(await request.arrayBuffer());if(body&&body.byteLength>max)return Response.json({error:'INVALID_REQUEST'},{status:413});
    const response=await fetch(`${legalApiBase()}/api/v1/${path.map(encodeURIComponent).join('/')}?${new URL(request.url).searchParams}`,{method:request.method,headers,body,cache:'no-store',signal:AbortSignal.timeout(15000)});
    const out=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    // fetch() already decoded a compressed upstream body; its content-length is the compressed size, so never copy it.
    for(const name of ['content-type','content-disposition']){const value=response.headers.get(name);if(value)out.set(name,value);}
    for(const value of response.headers.getSetCookie())out.append('set-cookie',value);
    return new Response(response.body,{status:response.status,headers:out});
  }catch{return Response.json({error:'WORKSPACE_UNAVAILABLE'},{status:503});}
}
export const GET=proxy,POST=proxy,PUT=proxy,PATCH=proxy;
