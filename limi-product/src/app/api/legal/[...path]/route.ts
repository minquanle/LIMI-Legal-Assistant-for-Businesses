import {legalApiBase} from '@/lib/legal-api';
export async function GET(request:Request,{params}:{params:Promise<{path:string[]}>}) {
  const {path}=await params;
  const joined=path.join('/');
  if(!/^(laws(\/[a-zA-Z0-9_-]{1,80}(\/(content|snapshots|provisions(\/[a-zA-Z0-9_-]{1,80})?|attachments(\/[a-zA-Z0-9_-]{1,80}\/(text|download))?))?)?|search|openapi\.json)$/.test(joined))return Response.json({error:'NOT_FOUND'},{status:404});
  const source=new URL(request.url);
  try{const response=await fetch(`${legalApiBase()}/api/v1/${path.map(encodeURIComponent).join('/')}?${source.searchParams}`,{cache:'no-store',signal:AbortSignal.timeout(30000)});
    const headers=new Headers({'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
    for(const key of ['content-type','content-length','content-disposition']){const value=response.headers.get(key);if(value)headers.set(key,value);}
    return new Response(response.body,{status:response.status,headers});
  }catch{return Response.json({error:'DOWNLOAD_UNAVAILABLE'},{status:503});}
}
