export interface AnalyticsSnapshot {
  id: string
  accountId: string
  capturedAt: string
  followers: number
  following: number
  totalPosts: number
  likesReceived: number
  repostsReceived: number
  repliesReceived: number
}

export interface PostAnalytics {
  id: string
  postId: string
  capturedAt: string
  likes: number
  reposts: number
  replies: number
  impressions: number
}
