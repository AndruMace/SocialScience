import type { LLMProvider } from './base.provider.js'
import { ClaudeProvider } from './claude.provider.js'
import { GeminiProvider } from './gemini.provider.js'
import { OpenAIProvider } from './openai.provider.js'
import { LLM_PROVIDERS } from '@socialscience/shared'

type ProviderFactory = () => LLMProvider

const providerFactories: Record<string, ProviderFactory> = {
  claude: () => new ClaudeProvider(),
  gemini: () => new GeminiProvider(),
  openai: () => new OpenAIProvider(),
}

export function createLLMProvider(
  providerName: string,
  options?: { model?: string | null; apiKey?: string },
): LLMProvider {
  const factory = providerFactories[providerName]
  if (!factory) throw new Error(`Unsupported LLM provider: ${providerName}`)
  const provider = factory()
  const defaultModel =
    LLM_PROVIDERS[providerName as keyof typeof LLM_PROVIDERS]?.defaultModel ?? provider.supportedModels[0]!
  provider.configure({ apiKey: options?.apiKey ?? '', model: options?.model ?? defaultModel })
  return provider
}

export function getAvailableProviders(): Array<{ name: string; models: string[] }> {
  return Object.entries(providerFactories).map(([name, factory]) => ({
    name,
    models: factory().supportedModels,
  }))
}
