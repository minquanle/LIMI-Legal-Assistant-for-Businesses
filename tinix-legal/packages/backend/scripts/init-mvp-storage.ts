import { createStorage } from '../src/modules/operations/storage.js';
import { loadConfig } from '../src/modules/operations/config.js';
const config = loadConfig();
const storage = createStorage(config);
try {
  if (!await storage.bucketExists(config.bucket)) await storage.makeBucket(config.bucket);
  // Absence of bucket policy means private access. Fail rather than silently change a public bucket.
  let policy = '';
  try { policy = await storage.getBucketPolicy(config.bucket); }
  catch (error) { if ((error as {code?: string}).code !== 'NoSuchBucketPolicy') throw error; }
  if (policy) throw new Error('Bucket has a policy; review it before using it for private evidence');
  console.log(JSON.stringify({ event: 'private_storage_ready', bucket: config.bucket }));
} catch { console.error('MVP storage initialization failed; check credentials, endpoint and bucket policy.'); process.exitCode = 1; }
