export const LLM_PROVIDERS = {
  claude: {
    name: 'Claude (Anthropic)',
    models: [
      'claude-opus-4-6',
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
    ],
    defaultModel: 'claude-sonnet-4-6',
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini'],
    defaultModel: 'gpt-4o-mini',
  },
} as const

export type LLMProviderName = keyof typeof LLM_PROVIDERS
