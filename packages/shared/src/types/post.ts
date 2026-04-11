export type PostStatus = 'draft' | 'queued' | 'scheduled' | 'published' | 'failed'
export type PostMode = 'auto' | 'queue'

export interface Post {
  id: string
  accountId: string
  content: string
  status: PostStatus
  platformPostId: string | null
  scheduledFor: string | null
  publishedAt: string | null
  llmProvider: string | null
  llmModel: string | null
  generationPrompt: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}
