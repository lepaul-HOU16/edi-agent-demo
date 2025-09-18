// Centralized configuration
export const AGENT_CONFIG = {
  MAX_MEMORY: '4096',
  DEFAULT_MODEL: 'anthropic.claude-3-haiku-20240307-v1:0',
  TIMEOUT: 300000, // 5 minutes
  MAX_ITERATIONS: 10
} as const;

export const getFoundationModelId = (requested?: string): string => {
  return requested || process.env.AGENT_MODEL_ID || AGENT_CONFIG.DEFAULT_MODEL;
};
