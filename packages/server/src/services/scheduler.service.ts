import cron from 'node-cron'
import { and, eq, lte } from 'drizzle-orm'
import { db } from '../config/db.js'
import { posts } from '../db/schema/index.js'

let initialized = false

export const schedulerService = {
  async initialize() {
    if (initialized) return
    initialized = true

    const { handleAnalyticsPoll } = await import('../jobs/analytics-poller.job.js')
    const { handlePostGeneration } = await import('../jobs/post-generator.job.js')
    const { handlePublishPost } = await import('../jobs/post-publisher.job.js')

    // Poll analytics every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        await handleAnalyticsPoll({})
      } catch (err) {
        console.error('Analytics poll failed:', err)
      }
    })

    // Generate posts every 60 minutes
    cron.schedule('0 * * * *', async () => {
      try {
        await handlePostGeneration()
      } catch (err) {
        console.error('Post generation failed:', err)
      }
    })

    // Publish due scheduled posts every minute
    cron.schedule('* * * * *', async () => {
      try {
        const duePosts = await db
          .select({ id: posts.id, accountId: posts.accountId })
          .from(posts)
          .where(and(eq(posts.status, 'scheduled'), lte(posts.scheduledFor, new Date())))

        await Promise.allSettled(
          duePosts.map((p) =>
            handlePublishPost({ postId: p.id, accountId: p.accountId }).catch((err) =>
              console.error(`Failed to publish post ${p.id}:`, err),
            ),
          ),
        )
      } catch (err) {
        console.error('Scheduled post check failed:', err)
      }
    })

    console.log('✓ Scheduler initialized (node-cron)')
  },

  // Scheduling is now handled by the 1-minute DB poll — nothing to enqueue
  async schedulePost(_postId: string, _accountId: string, _scheduledFor: Date) {},

  async triggerAnalyticsRefresh(accountId: string) {
    const { handleAnalyticsPoll } = await import('../jobs/analytics-poller.job.js')
    await handleAnalyticsPoll({ accountId })
  },
}
