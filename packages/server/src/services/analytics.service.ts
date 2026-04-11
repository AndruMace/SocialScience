import { eq, desc, gte, and, lte } from 'drizzle-orm'
import { db } from '../config/db.js'
import { analyticsSnapshots, postAnalytics, posts, accounts } from '../db/schema/index.js'
import { accountService } from './account.service.js'
import { gameService } from './game.service.js'
import { XP_REWARDS } from '@socialscience/shared'

export const analyticsService = {
  async pollAccount(accountId: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1)
    if (!account) return

    try {
      const adapter = await accountService.getAuthenticatedAdapter(account)
      const profile = await adapter.getProfile()

      // Get previous snapshot to compute follower delta
      const [prev] = await db
        .select()
        .from(analyticsSnapshots)
        .where(eq(analyticsSnapshots.accountId, accountId))
        .orderBy(desc(analyticsSnapshots.capturedAt))
        .limit(1)

      await db.insert(analyticsSnapshots).values({
        accountId,
        followers: profile.followers,
        following: profile.following,
        totalPosts: profile.postsCount,
      })

      // Award XP for follower gains
      if (prev && profile.followers > prev.followers) {
        const gained = profile.followers - prev.followers
        await gameService.awardXp(accountId, 'follower_gained', gained * XP_REWARDS.FOLLOWER_GAINED, {
          gained,
        })
      }

      // Update post analytics for recent published posts
      const recentPublished = await db
        .select()
        .from(posts)
        .where(and(eq(posts.accountId, accountId), eq(posts.status, 'published')))
        .orderBy(desc(posts.publishedAt))
        .limit(10)

      for (const post of recentPublished) {
        if (!post.platformPostId) continue
        try {
          const metrics = await adapter.getPostMetrics(post.platformPostId)
          const [previousMetrics] = await db
            .select()
            .from(postAnalytics)
            .where(eq(postAnalytics.postId, post.id))
            .orderBy(desc(postAnalytics.capturedAt))
            .limit(1)

          await db.insert(postAnalytics).values({
            postId: post.id,
            likes: metrics.likes,
            reposts: metrics.reposts,
            replies: metrics.replies,
          })

          // Award XP for engagement (compared to last snapshot)
          const likesGained = Math.max(0, metrics.likes - (previousMetrics?.likes ?? 0))
          const repostsGained = Math.max(0, metrics.reposts - (previousMetrics?.reposts ?? 0))
          const repliesGained = Math.max(0, metrics.replies - (previousMetrics?.replies ?? 0))
          const xpGained =
            likesGained * XP_REWARDS.LIKE_RECEIVED +
            repostsGained * XP_REWARDS.REPOST_RECEIVED +
            repliesGained * XP_REWARDS.REPLY_RECEIVED

          if (xpGained > 0) {
            await gameService.awardXp(accountId, 'engagement', xpGained, {
              postId: post.id,
              likesGained,
              repostsGained,
              repliesGained,
            })
          }

          await gameService.checkViralPost(accountId, metrics.likes, post.id)
        } catch {
          // Non-fatal: skip this post's metrics
        }
      }

      // Check post count achievements against all published posts, not just the recent sample.
      await gameService.checkPostCountAchievements(accountId)
      await gameService.checkAchievements(accountId)
    } catch (err) {
      console.error(`Failed to poll account ${accountId}:`, err)
    }
  },

  async getAccountAnalytics(accountId: string, from?: string, to?: string) {
    const conditions = [eq(analyticsSnapshots.accountId, accountId)]
    if (from) conditions.push(gte(analyticsSnapshots.capturedAt, new Date(from)))
    if (to) conditions.push(lte(analyticsSnapshots.capturedAt, new Date(to)))
    return db
      .select()
      .from(analyticsSnapshots)
      .where(and(...conditions))
      .orderBy(analyticsSnapshots.capturedAt)
  },

  async getLatestSnapshot(accountId: string) {
    const [latest] = await db
      .select()
      .from(analyticsSnapshots)
      .where(eq(analyticsSnapshots.accountId, accountId))
      .orderBy(desc(analyticsSnapshots.capturedAt))
      .limit(1)
    return latest ?? null
  },

  async getPostAnalytics(postId: string) {
    return db
      .select()
      .from(postAnalytics)
      .where(eq(postAnalytics.postId, postId))
      .orderBy(postAnalytics.capturedAt)
  },
}
