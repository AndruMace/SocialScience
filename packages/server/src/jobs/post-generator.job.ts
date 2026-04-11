import { eq, and, gte, count } from 'drizzle-orm'
import { db } from '../config/db.js'
import { accounts, strategies, posts } from '../db/schema/index.js'
import { schedulerService } from '../services/scheduler.service.js'
import { createLLMProvider } from '../llm/registry.js'
import { createPlatformAdapter } from '../platforms/registry.js'
import { settingsService } from '../services/settings.service.js'

export async function handlePostGeneration() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find all active accounts with strategies that have auto_post_enabled
  const activeStrategies = await db
    .select({ strategy: strategies, account: accounts })
    .from(strategies)
    .innerJoin(accounts, eq(strategies.accountId, accounts.id))
    .where(and(eq(accounts.isActive, true), eq(strategies.postMode, 'auto')))

  for (const { strategy, account } of activeStrategies) {
    try {
      // Count posts already created today
      const [todayCount] = await db
        .select({ count: count() })
        .from(posts)
        .where(
          and(
            eq(posts.accountId, account.id),
            gte(posts.createdAt, today),
          ),
        )

      const postsToday = todayCount?.count ?? 0
      if (postsToday >= strategy.postFrequency) continue

      // Generate a post
      if (!isValidWindow(strategy.scheduleStart, strategy.scheduleEnd)) {
        console.error(`Skipping post generation for account ${account.id}: invalid posting window`)
        continue
      }

      const llmConfig = await settingsService.resolveLlmConfig(account.userId, strategy.llmProvider, strategy.llmModel)
      const provider = createLLMProvider(llmConfig.provider, {
        model: llmConfig.model,
        apiKey: llmConfig.apiKey,
      })
      const adapter = createPlatformAdapter(account.platform)

      const recentPosts = await db
        .select({ content: posts.content })
        .from(posts)
        .where(eq(posts.accountId, account.id))
        .orderBy(posts.createdAt)
        .limit(5)

      const result = await provider.generatePost({
        niche: strategy.niche,
        tone: strategy.tone,
        personaPrompt: strategy.personaPrompt,
        maxLength: adapter.getMaxPostLength(),
        recentPosts: recentPosts.map((p) => p.content),
      })

      // Schedule it at a random time within the posting window
      const scheduledFor = getRandomTimeInWindow(strategy.scheduleStart, strategy.scheduleEnd)

      const [post] = await db
        .insert(posts)
        .values({
          accountId: account.id,
          content: result.content,
          status: 'scheduled',
          scheduledFor,
          llmProvider: result.provider,
          llmModel: result.model,
        })
        .returning()

      if (post) {
        await schedulerService.schedulePost(post.id, account.id, scheduledFor)
      }
    } catch (err) {
      console.error(`Failed to generate post for account ${account.id}:`, err)
    }
  }
}

function getRandomTimeInWindow(start: string, end: string): Date {
  const now = new Date()
  const [startH = 9, startM = 0] = start.split(':').map(Number)
  const [endH = 21, endM = 0] = end.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes

  const scheduled = new Date(now)
  scheduled.setHours(Math.floor(randomMinutes / 60), randomMinutes % 60, 0, 0)

  // If the time has already passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1)
  }

  return scheduled
}

function isValidWindow(start: string, end: string): boolean {
  const [startH = 0, startM = 0] = start.split(':').map(Number)
  const [endH = 0, endM = 0] = end.split(':').map(Number)
  return endH * 60 + endM > startH * 60 + startM
}
