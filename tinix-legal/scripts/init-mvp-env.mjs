import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
const root = new URL('../', import.meta.url);
const password = randomBytes(24).toString('hex');
const secret = randomBytes(32).toString('hex');
const template = await readFile(new URL('.limi.env.example', root), 'utf8');
try {
  await writeFile(new URL('.limi.env', root), template.replaceAll('replace-with-generated-password', password)
    .replaceAll('replace-with-generated-secret', secret), { flag: 'wx', mode: 0o600 });
  console.log('Created .limi.env with unique local credentials. Values are not printed.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.limi.env already exists; left unchanged.');
}
