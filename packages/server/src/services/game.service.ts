import { eq, and, desc, sql, count, sum, notInArray } from 'drizzle-orm'
import { db } from '../config/db.js'
import { gameState, achievements, xpEvents, accounts, analyticsSnapshots, posts } from '../db/schema/index.js'
import { levelFromXp, ACHIEVEMENTS, XP_REWARDS, followersToStatureXp } from '@socialscience/shared'
import { getSupportedPlatforms } from '../platforms/registry.js'

/** Event rows that adjust total XP but are not part of activity XP (see awardXp). */
const NON_ACTIVITY_EVENT_TYPES = ['follower_gained', 'follower_stature_sync'] as const

export const gameService = {
  async awardXp(
    accountId: string,
    eventType: string,
    amount: number,
    metadata?: Record<string, unknown>,
  ) {
    const { oldLevel, newXp, newLevel } = await db.transaction(async (tx) => {
      await tx.insert(gameState).values({ accountId }).onConflictDoNothing()

      const [current] = await tx
        .select({
          activityXp: gameState.activityXp,
          followerStatureXp: gameState.followerStatureXp,
          level: gameState.level,
        })
        .from(gameState)
        .where(eq(gameState.accountId, accountId))
        .for('update')

      const activityXp = current?.activityXp ?? 0
      const followerStatureXp = current?.followerStatureXp ?? 0
      const oldLevel = current?.level ?? 1

      const newActivityXp = activityXp + amount
      const newXp = newActivityXp + followerStatureXp
      const newLevel = levelFromXp(newXp)

      await tx.insert(xpEvents).values({
        accountId,
        eventType,
        xpAmount: amount,
        metadata: metadata ?? {},
      })

      await tx
        .update(gameState)
        .set({
          activityXp: newActivityXp,
          xp: newXp,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(gameState.accountId, accountId))

      return { oldLevel, newXp, newLevel }
    })

    const newAchievements = await this.checkAchievements(accountId)

    return {
      newXp,
      newLevel,
      leveledUp: newLevel > oldLevel,
      newAchievements,
    }
  },

  /**
   * Sets follower stature XP from the current follower count (monotonic mapping).
   * Call after capturing an analytics snapshot so totals reflect audience size.
   */
  async syncFollowerStature(accountId: string, followers: number): Promise<void> {
    const newStature = followersToStatureXp(followers)

    await db.transaction(async (tx) => {
      await tx.insert(gameState).values({ accountId }).onConflictDoNothing()

      const [current] = await tx
        .select({
          activityXp: gameState.activityXp,
          followerStatureXp: gameState.followerStatureXp,
        })
        .from(gameState)
        .where(eq(gameState.accountId, accountId))
        .for('update')

      const activityXp = current?.activityXp ?? 0
      const oldStature = current?.followerStatureXp ?? 0

      const delta = newStature - oldStature
      const newXp = activityXp + newStature
      const newLevel = levelFromXp(newXp)

      if (delta !== 0) {
        await tx.insert(xpEvents).values({
          accountId,
          eventType: 'follower_stature_sync',
          xpAmount: delta,
          metadata: { followers },
        })
      }

      await tx
        .update(gameState)
        .set({
          followerStatureXp: newStature,
          xp: newXp,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(gameState.accountId, accountId))
    })

    await this.checkAchievements(accountId)
  },

  /** Recompute activity/stature/total/level from xp_events + latest snapshot. Use after schema migrations. */
  async reconcileGameStateFromEvents(accountId: string): Promise<void> {
    const [agg] = await db
      .select({ activity: sum(xpEvents.xpAmount) })
      .from(xpEvents)
      .where(
        and(
          eq(xpEvents.accountId, accountId),
          notInArray(xpEvents.eventType, [...NON_ACTIVITY_EVENT_TYPES]),
        ),
      )

    const activityXp = Number(agg?.activity ?? 0)

    const [latest] = await db
      .select()
      .from(analyticsSnapshots)
      .where(eq(analyticsSnapshots.accountId, accountId))
      .orderBy(desc(analyticsSnapshots.capturedAt))
      .limit(1)

    const followerStatureXp = followersToStatureXp(latest?.followers ?? 0)
    const totalXp = activityXp + followerStatureXp
    const newLevel = levelFromXp(totalXp)

    await db
      .insert(gameState)
      .values({
        accountId,
        activityXp,
        followerStatureXp,
        xp: totalXp,
        level: newLevel,
      })
      .onConflictDoUpdate({
        target: [gameState.accountId],
        set: {
          activityXp,
          followerStatureXp,
          xp: totalXp,
          level: newLevel,
          updatedAt: new Date(),
        },
      })
  },

  /** Rebuild activity/stature splits for every account (run once after migrating schema). */
  async reconcileAllGameStates(): Promise<void> {
    const rows = await db.select({ accountId: gameState.accountId }).from(gameState)
    for (const { accountId } of rows) {
      await this.reconcileGameStateFromEvents(accountId)
    }
  },

  async checkAchievements(accountId: string): Promise<string[]> {
    const [state] = await db
      .select()
      .from(gameState)
      .where(eq(gameState.accountId, accountId))
      .limit(1)
    if (!state) return []

    const existingAchievements = await db
      .select({ key: achievements.achievementKey })
      .from(achievements)
      .where(eq(achievements.accountId, accountId))
    const unlockedKeys = new Set(existingAchievements.map((a) => a.key))

    const latestSnapshot = await db
      .select()
      .from(analyticsSnapshots)
      .where(eq(analyticsSnapshots.accountId, accountId))
      .orderBy(desc(analyticsSnapshots.capturedAt))
      .limit(1)

    const followers = latestSnapshot[0]?.followers ?? 0

    const accountPlatforms = await db
      .select({ id: accounts.id, platform: accounts.platform })
      .from(accounts)
      .where(eq(accounts.userId, (
        await db.select({ userId: accounts.userId }).from(accounts).where(eq(accounts.id, accountId)).limit(1)
      )[0]?.userId ?? ''))

    const accountCount = accountPlatforms.length
    const supportedPlatforms = getSupportedPlatforms()
    const connectedPlatforms = new Set(accountPlatforms.map((account) => account.platform))

    const newlyUnlocked: string[] = []

    for (const def of ACHIEVEMENTS) {
      if (unlockedKeys.has(def.key)) continue

      let shouldUnlock = false

      if (def.key === 'first_account' && accountCount >= 1) shouldUnlock = true
      if (def.key === 'multi_account' && accountCount >= 3) shouldUnlock = true
      if (def.key === 'all_platforms' && supportedPlatforms.every((platform) => connectedPlatforms.has(platform))) shouldUnlock = true
      if (def.key === 'followers_10' && followers >= 10) shouldUnlock = true
      if (def.key === 'followers_50' && followers >= 50) shouldUnlock = true
      if (def.key === 'followers_100' && followers >= 100) shouldUnlock = true
      if (def.key === 'followers_500' && followers >= 500) shouldUnlock = true
      if (def.key === 'followers_1000' && followers >= 1000) shouldUnlock = true
      if (def.key === 'followers_5000' && followers >= 5000) shouldUnlock = true
      if (def.key === 'followers_10000' && followers >= 10000) shouldUnlock = true
      if (def.key === 'streak_3' && state.streakDays >= 3) shouldUnlock = true
      if (def.key === 'streak_7' && state.streakDays >= 7) shouldUnlock = true
      if (def.key === 'streak_30' && state.streakDays >= 30) shouldUnlock = true
      if (def.key === 'streak_100' && state.streakDays >= 100) shouldUnlock = true

      if (shouldUnlock) {
        await db
          .insert(achievements)
          .values({ accountId, achievementKey: def.key })
          .onConflictDoNothing()
        newlyUnlocked.push(def.key)
      }
    }

    return newlyUnlocked
  },

  async checkPostCountAchievements(accountId: string): Promise<void> {
    const [publishedRow] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.accountId, accountId), eq(posts.status, 'published')))
    const publishedCount = publishedRow?.count ?? 0

    const milestones: Array<[string, number]> = [
      ['first_post', 1],
      ['posts_10', 10],
      ['posts_50', 50],
      ['posts_100', 100],
      ['posts_500', 500],
    ]
    for (const [key, threshold] of milestones) {
      if (publishedCount >= threshold) {
        await db
          .insert(achievements)
          .values({ accountId, achievementKey: key })
          .onConflictDoNothing()
      }
    }
  },

  async checkViralPost(accountId: string, likes: number, postId: string): Promise<void> {
    const [existingBonus] = await db
      .select({ id: xpEvents.id })
      .from(xpEvents)
      .where(and(eq(xpEvents.accountId, accountId), eq(xpEvents.eventType, 'viral_post'), sql`${xpEvents.metadata} ->> 'postId' = ${postId}`))
      .limit(1)

    if (existingBonus) return

    if (likes >= 1000) {
      await db
        .insert(achievements)
        .values({ accountId, achievementKey: 'mega_viral' })
        .onConflictDoNothing()
      await this.awardXp(accountId, 'viral_post', XP_REWARDS.VIRAL_POST_BONUS, { postId })
    } else if (likes >= 100) {
      await db
        .insert(achievements)
        .values({ accountId, achievementKey: 'viral_post' })
        .onConflictDoNothing()
      await this.awardXp(accountId, 'viral_post', XP_REWARDS.VIRAL_POST_BONUS, { postId })
    }
  },

  async updateStreak(accountId: string): Promise<number> {
    const [state] = await db
      .select()
      .from(gameState)
      .where(eq(gameState.accountId, accountId))
      .limit(1)
    if (!state) return 0

    const today = new Date().toISOString().split('T')[0]!
    const lastPost = state.lastPostDate

    let newStreak = state.streakDays
    if (lastPost === today) return newStreak

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]!

    if (lastPost === yesterdayStr) {
      newStreak += 1
    } else if (lastPost !== today) {
      newStreak = 1
    }

    await db
      .update(gameState)
      .set({ streakDays: newStreak, lastPostDate: today, updatedAt: new Date() })
      .where(eq(gameState.accountId, accountId))

    if (newStreak > 0) {
      await this.awardXp(accountId, 'streak_bonus', XP_REWARDS.STREAK_BONUS_PER_DAY * newStreak)
    }

    return newStreak
  },

  async getGameState(accountId: string) {
    const [state] = await db
      .select()
      .from(gameState)
      .where(eq(gameState.accountId, accountId))
      .limit(1)
    return state ?? null
  },

  async getAchievements(accountId: string) {
    return db
      .select()
      .from(achievements)
      .where(eq(achievements.accountId, accountId))
      .orderBy(achievements.unlockedAt)
  },

  async getXpHistory(accountId: string, limit = 20) {
    return db
      .select()
      .from(xpEvents)
      .where(eq(xpEvents.accountId, accountId))
      .orderBy(desc(xpEvents.createdAt))
      .limit(limit)
  },

  async getLeaderboard(userId: string) {
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)))

    const entries = await Promise.all(
      userAccounts.map(async (account) => {
        const [state] = await db
          .select()
          .from(gameState)
          .where(eq(gameState.accountId, account.id))
          .limit(1)

        const [latest] = await db
          .select()
          .from(analyticsSnapshots)
          .where(eq(analyticsSnapshots.accountId, account.id))
          .orderBy(desc(analyticsSnapshots.capturedAt))
          .limit(1)

        const [achievementRow] = await db
          .select({ count: count() })
          .from(achievements)
          .where(eq(achievements.accountId, account.id))

        return {
          accountId: account.id,
          handle: account.handle,
          platform: account.platform,
          avatarUrl: account.avatarUrl,
          level: state?.level ?? 1,
          xp: state?.xp ?? 0,
          followers: latest?.followers ?? 0,
          followerGrowthRate: 0,
          streak: state?.streakDays ?? 0,
          achievementCount: achievementRow?.count ?? 0,
          rank: 0,
        }
      }),
    )

    entries.sort((a, b) => b.xp - a.xp)
    return entries.map((e, i) => ({ ...e, rank: i + 1 }))
  },
}
