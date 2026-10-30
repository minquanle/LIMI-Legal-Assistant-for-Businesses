import * as http from 'node:http';
import * as https from 'node:https';
import { Client } from 'minio';
import type { MvpConfig } from './config.js';

export function createStorage(config: MvpConfig) {
  const protocol = config.minioSsl ? https : http;
  const request = ((options: http.RequestOptions, callback?: (response: http.IncomingMessage) => void) => {
    const req = protocol.request(options, callback);
    const timer = setTimeout(() => req.destroy(new Error('Storage request timed out')), config.healthTimeoutMs);
    req.once('close', () => clearTimeout(timer));
    return req;
  }) as typeof http.request;
  return new Client({ endPoint: config.minioEndpoint, port: config.minioPort, useSSL: config.minioSsl,
    accessKey: config.minioAccessKey, secretKey: config.minioSecretKey, ...(config.minioRegion ? { region: config.minioRegion } : {}),
    transport: { request }, retryOptions: { disableRetry: true } });
}
