export interface LLMConfig {
  apiKey: string
  model: string
  maxTokens?: number
  temperature?: number
}

export interface GeneratePostInput {
  niche: string
  tone: string
  personaPrompt?: string | null
  maxLength: number
  recentPosts?: string[]
  context?: string
}

export interface GeneratePostOutput {
  content: string
  provider: string
  model: string
  tokensUsed: number
}

export abstract class LLMProvider {
  abstract readonly providerName: string
  abstract readonly supportedModels: string[]

  abstract configure(config: LLMConfig): void
  abstract generatePost(input: GeneratePostInput): Promise<GeneratePostOutput>
  abstract generateReply(originalPost: string, input: GeneratePostInput): Promise<GeneratePostOutput>
  abstract testConnection(): Promise<boolean>

  protected buildSystemPrompt(input: GeneratePostInput): string {
    const recentPostsSection =
      input.recentPosts && input.recentPosts.length > 0
        ? `\n\nYour recent posts (avoid repeating these ideas):\n${input.recentPosts.map((p) => `- ${p}`).join('\n')}`
        : ''
    const personaSection = input.personaPrompt ? `\n\nAdditional persona details: ${input.personaPrompt}` : ''
    const contextSection = input.context ? `\n\nContext/trending: ${input.context}` : ''
    return `You are a social media content creator. Your niche is ${input.niche}. Your tone is ${input.tone}.${personaSection}

Generate a single social media post. Maximum ${input.maxLength} characters.
Do not include hashtags unless they are natural to the topic.
Be engaging and authentic. Do not be generic. Output only the post text, nothing else.${recentPostsSection}${contextSection}`
  }

  /** System prompt when improving an existing draft (augment). */
  protected buildAugmentSystemPrompt(input: GeneratePostInput): string {
    const recentPostsSection =
      input.recentPosts && input.recentPosts.length > 0
        ? `\n\nAuthor's recent posts (avoid repeating the same angles):\n${input.recentPosts.map((p) => `- ${p}`).join('\n')}`
        : ''
    const personaSection = input.personaPrompt ? `\n\nPersona details: ${input.personaPrompt}` : ''
    const contextSection = input.context ? `\n\nExtra context for this revision: ${input.context}` : ''
    return `You are editing short-form social posts. Niche: ${input.niche}. Target tone: ${input.tone}.${personaSection}

Rewrite and improve the author's draft below. Preserve their intent and facts; improve clarity, hook, and punch. Maximum ${input.maxLength} characters. Hashtags only if natural. Output only the improved post text, nothing else.${recentPostsSection}${contextSection}`
  }

  abstract augmentPost(draft: string, input: GeneratePostInput): Promise<GeneratePostOutput>
}
