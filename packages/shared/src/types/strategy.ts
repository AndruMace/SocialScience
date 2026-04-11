import type { PostMode } from './post.js'

export interface EngagementRules {
  autoLike: boolean
  autoReply: boolean
  followBack: boolean
  quotePostTrending: boolean
}

export interface Strategy {
  id: string
  accountId: string
  niche: string
  tone: string
  personaPrompt: string | null
  postFrequency: number
  scheduleStart: string
  scheduleEnd: string
  timezone: string
  postMode: PostMode
  llmProvider: string | null
  llmModel: string | null
  engagementRules: EngagementRules
  createdAt: string
  updatedAt: string
}
