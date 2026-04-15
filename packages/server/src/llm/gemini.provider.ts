import { GoogleGenerativeAI } from '@google/generative-ai'
import { LLMProvider } from './base.provider.js'
import type { LLMConfig, GeneratePostInput, GeneratePostOutput } from './base.provider.js'

export class GeminiProvider extends LLMProvider {
  readonly providerName = 'gemini'
  readonly supportedModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']

  private genAI?: GoogleGenerativeAI
  private config?: LLMConfig

  configure(config: LLMConfig): void {
    this.config = config
    this.genAI = new GoogleGenerativeAI(config.apiKey)
  }

  private tokenUsage(result: { response: { usageMetadata?: { totalTokenCount?: number; promptTokenCount?: number; candidatesTokenCount?: number } } }): number {
    const u = result.response.usageMetadata
    if (!u) return 0
    if (typeof u.totalTokenCount === 'number') return u.totalTokenCount
    return (u.promptTokenCount ?? 0) + (u.candidatesTokenCount ?? 0)
  }

  async generatePost(input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.genAI || !this.config) throw new Error('GeminiProvider not configured')
    const model = this.genAI.getGenerativeModel({
      model: this.config.model,
      systemInstruction: this.buildSystemPrompt(input),
      generationConfig: {
        maxOutputTokens: this.config.maxTokens ?? 512,
        temperature: this.config.temperature ?? 0.7,
      },
    })
    const result = await model.generateContent('Generate a post now.')
    const text = result.response.text()
    return {
      content: text.trim(),
      provider: 'gemini',
      model: this.config.model,
      tokensUsed: this.tokenUsage(result),
    }
  }

  async augmentPost(draft: string, input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.genAI || !this.config) throw new Error('GeminiProvider not configured')
    const model = this.genAI.getGenerativeModel({
      model: this.config.model,
      systemInstruction: this.buildAugmentSystemPrompt(input),
      generationConfig: {
        maxOutputTokens: this.config.maxTokens ?? 512,
        temperature: this.config.temperature ?? 0.7,
      },
    })
    const result = await model.generateContent(`Improve this draft:\n\n"""${draft}"""`)
    const text = result.response.text()
    return {
      content: text.trim(),
      provider: 'gemini',
      model: this.config.model,
      tokensUsed: this.tokenUsage(result),
    }
  }

  async generateReply(originalPost: string, input: GeneratePostInput): Promise<GeneratePostOutput> {
    if (!this.genAI || !this.config) throw new Error('GeminiProvider not configured')
    const model = this.genAI.getGenerativeModel({
      model: this.config.model,
      systemInstruction: this.buildSystemPrompt(input),
      generationConfig: {
        maxOutputTokens: 256,
        temperature: this.config.temperature ?? 0.7,
      },
    })
    const result = await model.generateContent(
      `Reply to this post in a way that fits your persona. Keep it under ${input.maxLength} characters.\n\nOriginal post: "${originalPost}"`,
    )
    const text = result.response.text()
    return {
      content: text.trim(),
      provider: 'gemini',
      model: this.config.model,
      tokensUsed: this.tokenUsage(result),
    }
  }

  async testConnection(): Promise<void> {
    if (!this.genAI || !this.config) throw new Error('Gemini provider not configured')
    const key = this.config.apiKey?.trim()
    if (!key) throw new Error('Missing Gemini API key')

    // Try configured model first, then fallbacks (model IDs vary by API version / availability).
    const tryModels = [this.config.model, ...this.supportedModels.filter((m) => m !== this.config!.model)]
    let lastErr: unknown
    for (const modelId of tryModels) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelId,
          generationConfig: { maxOutputTokens: 8 },
        })
        const result = await model.generateContent('Hi')
        result.response.text()
        return
      } catch (e) {
        lastErr = e
      }
    }
    const msg =
      lastErr instanceof Error
        ? lastErr.message
        : typeof lastErr === 'object' && lastErr !== null && 'message' in lastErr
          ? String((lastErr as { message: unknown }).message)
          : 'Gemini request failed'
    throw new Error(msg)
  }
}
