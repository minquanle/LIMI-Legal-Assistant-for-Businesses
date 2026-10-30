import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
const content=`LIMI_RELEASE=b16-local-v1\nLIMI_SITE=https://localhost:8443\nLIMI_POSTGRES_USER=limi\nLIMI_POSTGRES_DB=limi_staging\nLIMI_POSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\nLIMI_MINIO_ROOT_USER=limi-storage\nLIMI_MINIO_ROOT_PASSWORD=${randomBytes(32).toString('hex')}\nAPI_PORT=4010\nWORKER_HEALTH_PORT=4011\nSCHEDULER_HEALTH_PORT=4012\n`;
await writeFile(new URL('.staging.env',import.meta.url),content,{flag:'wx',mode:0o600});
console.log('Created staging secrets; existing files are never overwritten.');
