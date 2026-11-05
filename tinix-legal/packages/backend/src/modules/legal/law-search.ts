// Library search for business users: accent-insensitive ("thue thu nhap"), common abbreviations ("BHXH", "TNCN")
// and document numbers ("108/2025/QH15"). The curated catalogue is small, so ranking runs in memory.

/** Lowercase, without Vietnamese diacritics, punctuation turned into spaces except the separators of document numbers. */
export function foldVietnamese(value:string):string{
  return String(value??'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[đĐ]/g,'d').toLowerCase()
    .replace(/[^a-z0-9/\- ]+/g,' ').replace(/\s+/g,' ').trim();
}

export const LEGAL_ABBREVIATIONS:Record<string,string>={
  bhxh:'bao hiem xa hoi',bhyt:'bao hiem y te',bhtn:'bao hiem that nghiep',tncn:'thu nhap ca nhan',tndn:'thu nhap doanh nghiep',
  gtgt:'gia tri gia tang',vat:'gia tri gia tang',ttdb:'tieu thu dac biet',hddt:'hoa don dien tu',hdld:'hop dong lao dong',
  pccc:'phong chay chua chay',atvsld:'an toan ve sinh lao dong',attp:'an toan thuc pham',shtt:'so huu tri tue',
  tmdt:'thuong mai dien tu',dnnvv:'doanh nghiep nho va vua',bvmt:'bao ve moi truong',dlcn:'du lieu ca nhan',
  nld:'nguoi lao dong',nsdld:'nguoi su dung lao dong',xphc:'xu phat vi pham hanh chinh',qlt:'quan ly thue',
};

export type SearchableLaw={id:string;documentNumber:string;normalizedNumber?:string|null;title:string;trichYeu?:string|null;issuingBody?:string|null;field?:string|null;promulgationDate?:string|Date|null};

const isNumberQuery=(q:string)=>/\d/.test(q)&&/[/\-]/.test(q);
const dateValue=(d:SearchableLaw['promulgationDate'])=>{const t=d?new Date(d).getTime():NaN;return Number.isNaN(t)?0:t;};

/** Terms that must all appear: abbreviations become their phrase, other words must start a word in the document. */
export function queryTerms(query:string):string[]{
  return foldVietnamese(query).split(' ').filter(Boolean).map(t=>LEGAL_ABBREVIATIONS[t]??t);
}

/** Matching documents, best first; without a query, newest issue date first. */
export function rankLaws<T extends SearchableLaw>(rows:T[],query?:string|null):T[]{
  const newestFirst=(a:T,b:T)=>dateValue(b.promulgationDate)-dateValue(a.promulgationDate)||a.documentNumber.localeCompare(b.documentNumber,'vi',{numeric:true});
  const q=(query??'').trim();
  if(!q)return [...rows].sort(newestFirst);
  const folded=foldVietnamese(q);
  if(isNumberQuery(q)){
    const compact=folded.replace(/\s+/g,'');
    return rows.filter(r=>[r.documentNumber,r.normalizedNumber??''].some(n=>foldVietnamese(n).replace(/\s+/g,'').includes(compact))).sort(newestFirst);
  }
  const terms=queryTerms(q),phrase=terms.join(' ');
  const scored:{row:T;score:number}[]=[];
  for(const row of rows){
    const title=' '+foldVietnamese(row.title)+' ',hay=' '+foldVietnamese([row.documentNumber,row.title,row.trichYeu,row.issuingBody,row.field].filter(Boolean).join(' '))+' ';
    if(!terms.every(t=>hay.includes(' '+t)))continue;
    scored.push({row,score:(title.includes(' '+phrase)?4:0)+terms.filter(t=>title.includes(' '+t)).length});
  }
  return scored.sort((a,b)=>b.score-a.score||newestFirst(a.row,b.row)).map(x=>x.row);
}
