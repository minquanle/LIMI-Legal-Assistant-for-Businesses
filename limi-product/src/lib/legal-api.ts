import 'server-only';
export interface Law {id:string;documentNumber:string;title:string;type:string;scope:string;group:string;snapshotId:string;reviewStatus:string;
  metadata:Record<string,unknown>;quality:{parseQuality?:{requiresOcrTextReview?:boolean;warnings?:string[]};legalReview?:string};
  sources?:{role:string;source:{id:string;url:string;domain:string;sourceKind:string}}[];}
export interface Attachment {id:string;role:string;status:string;mimeType:string;sizeBytes:string;provenance:{filename?:string;url?:string};hasExtractedText:boolean;downloadUrl:string;textUrl:string|null;}
export interface Page<T>{items:T[];total:number;page:number;pageSize:number;}
// LIMI_API_HOSTPORT is Render's private-network 'host:port' for the API service.
export const legalApiBase=()=>process.env.LIMI_API_URL??(process.env.LIMI_API_HOSTPORT?'http://'+process.env.LIMI_API_HOSTPORT:'http://127.0.0.1:4010');
export async function legalGet<T>(path:string):Promise<T>{
  const response=await fetch(`${legalApiBase()}/api/v1${path}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(response.status===404?'Không tìm thấy văn bản hoặc phiên bản.':'Chưa tải được dữ liệu luật. Vui lòng thử lại.');return response.json();
}
