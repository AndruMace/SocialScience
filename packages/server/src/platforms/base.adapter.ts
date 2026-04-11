export interface PlatformCredentials {
  handle: string
  password: string
  serviceUrl?: string
}

export interface PlatformProfile {
  platformUserId: string
  handle: string
  displayName: string
  avatarUrl?: string
  followers: number
  following: number
  postsCount: number
}

export interface PlatformPost {
  platformPostId: string
  content: string
  createdAt: Date
  likes: number
  reposts: number
  replies: number
  impressions?: number
}

export interface CreatePostInput {
  content: string
  replyTo?: string
  quoteTo?: string
}

export abstract class PlatformAdapter {
  abstract readonly platform: string

  abstract authenticate(creds: PlatformCredentials): Promise<void>
  abstract getProfile(): Promise<PlatformProfile>
  abstract createPost(input: CreatePostInput): Promise<PlatformPost>
  abstract deletePost(platformPostId: string): Promise<void>
  abstract getPostMetrics(platformPostId: string): Promise<PlatformPost>
  abstract getRecentPosts(limit?: number): Promise<PlatformPost[]>
  abstract likePost(platformPostId: string): Promise<void>
  abstract followUser(platformUserId: string): Promise<void>
  abstract getMaxPostLength(): number
  getTrending?(_limit?: number): Promise<string[]>
}
