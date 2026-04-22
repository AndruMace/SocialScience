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
  gemini: {
    name: 'Gemini (Google)',
    /** IDs for Google AI Studio (`generativelanguage.googleapis.com`); bare `gemini-1.5-*` names were retired. */
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-3-flash-preview'],
    defaultModel: 'gemini-3-flash-preview',
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini'],
    defaultModel: 'gpt-4o-mini',
  },
} as const

export type LLMProviderName = keyof typeof LLM_PROVIDERS
