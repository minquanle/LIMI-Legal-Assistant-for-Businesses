import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const dynamic='force-dynamic';
// The workspace runs only same-origin scripts; styles allow inline attributes (gauges, charts) and Google Fonts;
// the browser may query VietQR directly when the server is rate-limited (see product-workspace.js).
const CSP=["default-src 'self'","script-src 'self'","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src 'self' https://fonts.gstatic.com data:","img-src 'self' data: blob:","connect-src 'self' https://api.vietqr.io","frame-ancestors 'none'","base-uri 'self'","form-action 'self'","object-src 'none'"].join('; ');
export async function GET(){
  const source=await readFile(join(process.cwd(),'public/prototype/index.html'),'utf8');
  const html=source.replaceAll('href="./','href="/prototype/').replaceAll('src="./','src="/prototype/')
    .replace('</head>','<script src="/workspace-config.js?v=1"></script></head>');
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':CSP}});
}
