import type { AchievementDef } from '../types/game.js'

export const XP_REWARDS = {
  POST_PUBLISHED: 25,
  FOLLOWER_GAINED: 10,
  LIKE_RECEIVED: 2,
  REPOST_RECEIVED: 5,
  REPLY_RECEIVED: 3,
  STREAK_BONUS_PER_DAY: 15,
  VIRAL_POST_BONUS: 200,
  ACCOUNT_CONNECTED: 50,
} as const

export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level - 1, 1.8))
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) {
    level++
  }
  return level
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'NPC',
  5: 'Side Character',
  10: 'Party Member',
  15: 'Guild Recruit',
  20: 'Guild Member',
  25: 'Guild Officer',
  30: 'Dungeon Crawler',
  40: 'Boss Fighter',
  50: 'Legendary Hero',
  75: 'Realm Champion',
  100: 'Social Deity',
}

export function getLevelTitle(level: number): string {
  const thresholds = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a)
  const threshold = thresholds.find((t) => level >= t) ?? 1
  return LEVEL_TITLES[threshold]!
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Followers
  { key: 'followers_10', name: 'First Fan Club', description: 'Reach 10 followers', icon: 'fan-club', category: 'followers' },
  { key: 'followers_50', name: 'Rising Star', description: 'Reach 50 followers', icon: 'rising-star', category: 'followers' },
  { key: 'followers_100', name: 'Centurion', description: 'Reach 100 followers', icon: 'centurion', category: 'followers' },
  { key: 'followers_500', name: 'Village Elder', description: 'Reach 500 followers', icon: 'elder', category: 'followers' },
  { key: 'followers_1000', name: 'Town Mayor', description: 'Reach 1,000 followers', icon: 'mayor', category: 'followers' },
  { key: 'followers_5000', name: 'Regional Lord', description: 'Reach 5,000 followers', icon: 'lord', category: 'followers' },
  { key: 'followers_10000', name: 'Kingdom Ruler', description: 'Reach 10,000 followers', icon: 'ruler', category: 'followers' },
  // Posting
  { key: 'first_post', name: 'Hello World', description: 'Publish your first post', icon: 'hello-world', category: 'posting' },
  { key: 'posts_10', name: 'Content Apprentice', description: 'Publish 10 posts', icon: 'apprentice', category: 'posting' },
  { key: 'posts_50', name: 'Content Journeyman', description: 'Publish 50 posts', icon: 'journeyman', category: 'posting' },
  { key: 'posts_100', name: 'Content Master', description: 'Publish 100 posts', icon: 'master', category: 'posting' },
  { key: 'posts_500', name: 'Content Legend', description: 'Publish 500 posts', icon: 'legend', category: 'posting' },
  // Engagement
  { key: 'viral_post', name: 'Going Viral', description: 'Get 100+ likes on a single post', icon: 'viral', category: 'engagement' },
  { key: 'mega_viral', name: 'Internet Famous', description: 'Get 1,000+ likes on a single post', icon: 'famous', category: 'engagement' },
  // Streaks
  { key: 'streak_3', name: 'Warm Up', description: '3-day posting streak', icon: 'warmup', category: 'streak' },
  { key: 'streak_7', name: 'Weekly Warrior', description: '7-day posting streak', icon: 'warrior', category: 'streak' },
  { key: 'streak_30', name: 'Monthly Master', description: '30-day posting streak', icon: 'monthly', category: 'streak' },
  { key: 'streak_100', name: 'Unstoppable Force', description: '100-day posting streak', icon: 'unstoppable', category: 'streak' },
  // Misc
  { key: 'first_account', name: 'New Player', description: 'Connect your first account', icon: 'new-player', category: 'misc' },
  { key: 'multi_account', name: 'Portfolio Manager', description: 'Connect 3+ accounts', icon: 'portfolio', category: 'misc' },
  { key: 'all_platforms', name: 'Platform Nomad', description: 'Have accounts on every supported platform', icon: 'nomad', category: 'misc' },
]
