export type Platform = 'bluesky'

export interface Account {
  id: string
  userId: string
  platform: Platform
  handle: string
  displayName: string | null
  avatarUrl: string | null
  serviceUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AccountWithStats extends Account {
  followers: number
  following: number
  postsCount: number
}

export interface AccountSummary extends Account {
  summary: {
    level: number
    xp: number
    streakDays: number
    followers: number
    achievementCount: number
  }
}
