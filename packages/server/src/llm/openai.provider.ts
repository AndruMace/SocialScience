import OpenAI from 'openai'
import { LLMProvider } from './base.provider.js'
import type { LLMConfig, GeneratePostInput, GeneratePostOutput } from './base.provider.js'

export class OpenAIProvider extends LLMProvider {
  readonly providerName = 'openai'
  readonly supportedModels = ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini']

  private client?: OpenAI
  private config?: LLMConfig

  configure(config: LLMConfig): void {
    this.config = config
    this.client = new OpenAI({ apiKey: config.apiKey })
  }

  async generatePost(input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.client || !this.config) throw new Error('OpenAIProvider not configured')
    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 512,
      messages: [
        { role: 'system', content: this.buildSystemPrompt(input) },
        { role: 'user', content: 'Generate a post now.' },
      ],
    })
    const content = completion.choices[0]?.message.content
    if (!content) throw new Error('No content returned from OpenAI')
    return {
      content: content.trim(),
      provider: 'openai',
      model: this.config.model,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    }
  }

  async augmentPost(draft: string, input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.client || !this.config) throw new Error('OpenAIProvider not configured')
    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 512,
      messages: [
        { role: 'system', content: this.buildAugmentSystemPrompt(input) },
        {
          role: 'user',
          content: `Improve this draft:\n\n"""${draft}"""`,
        },
      ],
    })
    const content = completion.choices[0]?.message.content
    if (!content) throw new Error('No content returned from OpenAI')
    return {
      content: content.trim(),
      provider: 'openai',
      model: this.config.model,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    }
  }

  async generateReply(originalPost: string, input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.client || !this.config) throw new Error('OpenAIProvider not configured')
    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: 256,
      messages: [
        { role: 'system', content: this.buildSystemPrompt(input) },
        {
          role: 'user',
          content: `Reply to this post in a way that fits your persona. Keep it under ${input.maxLength} characters.\n\nOriginal post: "${originalPost}"`,
        },
      ],
    })
    const content = completion.choices[0]?.message.content
    if (!content) throw new Error('No content returned from OpenAI')
    return {
      content: content.trim(),
      provider: 'openai',
      model: this.config.model,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    }
  }

  async testConnection(): Promise<void> {
    if (!this.client) throw new Error('OpenAI provider not configured')
    await this.client.chat.completions.create({
      model: this.config?.model ?? 'gpt-4o-mini',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Hi' }],
    })
  }
}
