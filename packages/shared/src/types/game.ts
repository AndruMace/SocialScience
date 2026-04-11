export type AchievementCategory = 'followers' | 'posting' | 'engagement' | 'streak' | 'misc'

export interface GameState {
  id: string
  accountId: string
  xp: number
  level: number
  streakDays: number
  lastPostDate: string | null
  updatedAt: string
}

export interface Achievement {
  id: string
  accountId: string
  achievementKey: string
  unlockedAt: string
}

export interface AchievementDef {
  key: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
}

export interface XpEvent {
  id: string
  accountId: string
  eventType: string
  xpAmount: number
  metadata: Record<string, unknown>
  createdAt: string
}

export interface LeaderboardEntry {
  accountId: string
  handle: string
  platform: string
  avatarUrl: string | null
  level: number
  xp: number
  followers: number
  followerGrowthRate: number
  streak: number
  achievementCount: number
  rank: number
}
