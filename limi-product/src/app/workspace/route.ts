import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const dynamic='force-dynamic';
export async function GET(){
  const source=await readFile(join(process.cwd(),'public/prototype/index.html'),'utf8');
  const html=source.replaceAll('href="./','href="/prototype/').replaceAll('src="./','src="/prototype/')
    .replace('</head>','<script>window.LIMI_API_BASE="/api/legal";window.LIMI_ASSET_BASE="/prototype";window.LIMI_WORKSPACE_API="/api/workspace";</script></head>');
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
