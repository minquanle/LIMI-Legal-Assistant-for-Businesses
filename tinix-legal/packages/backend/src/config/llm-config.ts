function readEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value.trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

function requireEnv(keys: string[], description: string): string {
  const value = readEnv(keys);
  if (!value) {
    throw new Error(
      `${description} chưa được cấu hình. Vui lòng đặt biến môi trường: ${keys.join(' hoặc ')}.`
    );
  }
  return value;
}

/** Shared LLM connection config for CopilotLLMService and QALLMService. No hardcoded secrets/endpoints. */
export function getLLMApiUrl(): string {
  return requireEnv(['QA_LLM_API_URL', 'LLM_API_URL'], 'Địa chỉ API của LLM');
}

export function getLLMApiKey(): string {
  return requireEnv(['QA_LLM_API_KEY', 'LLM_API_KEY'], 'API key của LLM');
}

export function getLLMModel(): string {
  return readEnv(['QA_LLM_MODEL', 'LLM_MODEL_NAME']) || 'tinix-combo-1';
}
