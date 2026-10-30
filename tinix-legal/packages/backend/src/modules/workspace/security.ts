import {createHash, randomBytes, scrypt as derive, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export const token=()=>randomBytes(32).toString('base64url');
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${(await scrypt(password,salt,64) as Buffer).toString('hex')}`;}
export async function passwordMatches(password:string,encoded:string|null){
  const [,salt='00000000000000000000000000000000',expected='']=encoded?.split(':')??[];
  const actual=await scrypt(password,salt,64) as Buffer;
  const wanted=Buffer.from(expected,'hex');return wanted.length===actual.length&&timingSafeEqual(wanted,actual);
}
export function cookieValue(header:string|undefined,name:string){return header?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);}
