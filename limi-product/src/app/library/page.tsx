import {redirect} from 'next/navigation';
export default async function Library({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const raw=await searchParams;const p=new URLSearchParams({view:'laws'});for(const [key,value]of Object.entries(raw))if(typeof value==='string'&&['q','scope','group','page'].includes(key))p.set(key,value);redirect('/workspace?'+p);}
