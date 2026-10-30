/**
 * DEPRECATED: Direct database access from Frontend has been removed in favor of Backend REST API Client.
 * Please use `import { apiClient } from '@/lib/api-client'` instead.
 */
export const prisma = new Proxy({}, {
  get() {
    throw new Error(
      'Direct Prisma access from Frontend is deprecated and disabled. Use apiClient from "@/lib/api-client" instead.'
    );
  }
}) as any;
