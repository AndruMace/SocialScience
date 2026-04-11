import Anthropic from '@anthropic-ai/sdk'
import { LLMProvider } from './base.provider.js'
import type { LLMConfig, GeneratePostInput, GeneratePostOutput } from './base.provider.js'

export class ClaudeProvider extends LLMProvider {
  readonly providerName = 'claude'
  readonly supportedModels = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']

  private client?: Anthropic
  private config?: LLMConfig

  configure(config: LLMConfig): void {
    this.config = config
    this.client = new Anthropic({ apiKey: config.apiKey })
  }

  async generatePost(input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.client || !this.config) throw new Error('ClaudeProvider not configured')
    const message = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 512,
      system: this.buildSystemPrompt(input),
      messages: [{ role: 'user', content: 'Generate a post now.' }],
    })
    const content = message.content[0]
    if (content?.type !== 'text') throw new Error('Unexpected response type from Claude')
    return {
      content: content.text.trim(),
      provider: 'claude',
      model: this.config.model,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    }
  }

  async generateReply(originalPost: string, input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.client || !this.config) throw new Error('ClaudeProvider not configured')
    const message = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 256,
      system: this.buildSystemPrompt(input),
      messages: [
        {
          role: 'user',
          content: `Reply to this post in a way that fits your persona. Keep it under ${input.maxLength} characters.\n\nOriginal post: "${originalPost}"`,
        },
      ],
    })
    const content = message.content[0]
    if (content?.type !== 'text') throw new Error('Unexpected response type from Claude')
    return {
      content: content.text.trim(),
      provider: 'claude',
      model: this.config.model,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false
    try {
      await this.client.messages.create({
        model: this.supportedModels[1]!,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      return true
    } catch {
      return false
    }
  }
}
