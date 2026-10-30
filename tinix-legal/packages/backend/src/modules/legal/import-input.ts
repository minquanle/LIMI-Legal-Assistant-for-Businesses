import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
export async function hashFile(path:string) {const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex');}
export async function* readRecords(path:string):AsyncGenerator<{index:number;value:unknown;error?:string}> {
  const file=createReadStream(path),stream=path.endsWith('.gz')?file.pipe(createGunzip()):file;
  let index=0;
  try {
    if(/\.jsonl(\.gz)?$/i.test(path)) {
      const lines=createInterface({input:stream,crlfDelay:Infinity});
      for await(const line of lines){if(!line.trim())continue;
        let value:unknown;try{value=JSON.parse(line);}catch{yield {index:index++,value:null,error:'INVALID_JSON'};continue;}
        yield {index:index++,value};}
    } else if(/\.json(\.gz)?$/i.test(path)) {
      const {parser}=require('stream-json'),{streamArray}=require('stream-json/streamers/StreamArray');
      const tokens=stream.pipe(parser()),items=tokens.pipe(streamArray());
      stream.on('error',(e:Error)=>items.destroy(e));tokens.on('error',(e:Error)=>items.destroy(e));
      for await(const item of items)yield {index:item.key,value:item.value};
    } else throw new Error('UNSUPPORTED_INPUT_FORMAT');
  } finally {stream.destroy();file.destroy();}
}
