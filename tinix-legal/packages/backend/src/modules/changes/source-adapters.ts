import {load} from 'cheerio';
import {lookup} from 'node:dns/promises';
import * as tls from 'node:tls';
import {sha256,canonicalJson} from '../legal/record-adapter.js';
export const PARSER_VERSION='official-watch-1';
let trustConfigured=false;
export const OFFICIAL_DOMAINS=['vanban.chinhphu.vn','congbao.chinhphu.vn','vbpl.vn','hungyen.gov.vn','congbao.hungyen.gov.vn','datafiles.chinhphu.vn','datafiles.hungyen.gov.vn','g7.cdnchinhphu.vn'];
export function officialUrl(raw:string){const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||!OFFICIAL_DOMAINS.includes(u.hostname)||u.username||u.password||u.port||u.hash)throw Error('SOURCE_NOT_ALLOWED');return u;}
// Official domains only; redirects are checked at every hop. No arbitrary URLs from forms.
export async function officialFetch(raw:string,headers:Record<string,string>={},max=4000000):Promise<{status:number;headers:Headers;body:Buffer;url:string}>{
 // Use the OS trust store in addition to Node's bundled CAs (Windows government PKI).
 // Certificate and hostname verification remain enabled; never trust a fetched certificate.
 if(!trustConfigured&&typeof tls.setDefaultCACertificates==='function'){tls.setDefaultCACertificates([...tls.getCACertificates('default'),...tls.getCACertificates('system')]);trustConfigured=true;}
 let u=officialUrl(raw);for(let hop=0;hop<5;hop++){
  const addresses=await lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(x=>/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd]|fe80|::ffff:)/i.test(x.address)))throw Error('SOURCE_NOT_PUBLIC');
  const res=await fetch(u,{headers:{'User-Agent':'LIMI-LegalWatch/1.0',...headers},redirect:'manual',signal:AbortSignal.timeout(20000)});
  if([301,302,303,307,308].includes(res.status)){const location=res.headers.get('location');await res.body?.cancel();if(!location)throw Error('INVALID_REDIRECT');u=officialUrl(new URL(location,u).toString());continue;}
  if(Number(res.headers.get('content-length')||0)>max){await res.body?.cancel();throw Error('SOURCE_TOO_LARGE');}const chunks:Buffer[]=[];let size=0;if(res.body)for await(const c of res.body as any){size+=c.length;if(size>max)throw Error('SOURCE_TOO_LARGE');chunks.push(Buffer.from(c));}return {status:res.status,headers:res.headers,body:Buffer.concat(chunks),url:u.toString()};
 }throw Error('REDIRECT_LIMIT');
}
export function robotsAllowed(text:string,path:string){
 const groups:{agents:string[],rules:{allow:boolean,path:string}[]}[]=[];let g={agents:[] as string[],rules:[] as {allow:boolean,path:string}[]};
 for(const raw of text.split(/\r?\n/)){const line=raw.split('#')[0].trim(),i=line.indexOf(':');if(i<0)continue;const k=line.slice(0,i).toLowerCase(),v=line.slice(i+1).trim();if(k==='user-agent'){if(g.rules.length){groups.push(g);g={agents:[],rules:[]};}g.agents.push(v.toLowerCase());}else if((k==='allow'||k==='disallow')&&v)g.rules.push({allow:k==='allow',path:v});}groups.push(g);
 const exact=groups.filter(x=>x.agents.some(a=>a!=='*'&&'limi-legalwatch'.startsWith(a))),selected=exact.length?exact:groups.filter(x=>x.agents.includes('*'));let best=-1,allowed=true;
 for(const group of selected)for(const rule of group.rules){const p=rule.path.replace(/\$$/,'').split('*').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*'),regex=new RegExp('^'+p+(rule.path.endsWith('$')?'$':'')),length=rule.path.replace(/[*$]/g,'').length;if(regex.test(path)&&(length>best||length===best&&rule.allow)){best=length;allowed=rule.allow;}}
 return allowed;
}
export type Extracted={title:string;fullText:string;metadata:Record<string,string>;relations:string[];attachments:string[];links:string[]};
export function extractOfficial(html:string,url:string):Extracted{
 const $=load(html);$('script,style,nav,header,footer,.menu,.breadcrumb').remove();const u=officialUrl(url),domain=u.hostname;
 const selector=domain==='vbpl.vn'?'.fulltext, .content1, #divContent, #toanvan':domain==='vanban.chinhphu.vn'?'#divContent, .doc-content, .toanvan':domain==='congbao.chinhphu.vn'?'.document-content, .noidung, #divContent':'.document-content, .vbpq-content, #toanvan, .fulltext';
 const node=$(selector).first().clone();node.find('br').replaceWith('\n');node.find('p,div,tr').append('\n');let fullText=node.text().replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();if(!/Điều\s+\d+[.\s]/i.test(fullText)||fullText.length<200||/^(Error!|Access denied)/i.test(fullText))fullText='';
 const title=$(domain==='vanban.chinhphu.vn'&&u.searchParams.has('docid')?'h4, .doc-title':'h1, .doc-title, .document-title, .title, .vbtitle').first().text().trim()||$('title').text().trim();const metadata:Record<string,string>={};$('table tr').each((_i,e)=>{const cells=$(e).find('td');if(cells.length===2){const k=cells.eq(0).text().trim(),v=cells.eq(1).text().trim();if(/số ký hiệu|số hiệu|ban hành|hiệu lực|loại văn bản|người ký/i.test(k)&&k.length<100&&v.length<500)metadata[k]=v;}});
 const attachments:string[]=[],links:string[]=[];$('a[href]').each((_i,e)=>{try{const link=officialUrl(new URL($(e).attr('href')!,u).toString()).toString();if(/\.(pdf|docx?|zip)(\?|$)/i.test(link))attachments.push(link);else if(/docid=|ItemID=|\/van-ban\/|vbpq-toanvan|\/vb\//i.test(link)||domain==='congbao.hungyen.gov.vn'&&/\.html/.test(link)&&/(nghị quyết|quyết định|thông tư|luật).*(số|\d+\/)/i.test($(e).text()))links.push(link);}catch{}});
 const text=fullText||title;const relations=/sửa đổi|bổ sung|thay thế|bãi bỏ|hợp nhất/i.test(text)?[...new Set((text.match(/\d{1,4}\/\d{4}\/[\p{L}\d-]+/gu)||[]))].sort():[];
 return {title:title.slice(0,500),fullText,metadata,relations,attachments:[...new Set(attachments)].sort(),links:[...new Set(links)].sort()};
}
export function extractedHashes(x:Extracted){return {contentHash:x.fullText?sha256(x.fullText):null,metadataHash:sha256(canonicalJson({title:x.title,metadata:x.metadata,attachments:x.attachments})),relationHash:sha256(canonicalJson(x.relations))};}
