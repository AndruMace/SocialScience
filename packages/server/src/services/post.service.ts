import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../config/db.js'
import { posts, accounts, strategies } from '../db/schema/index.js'
import { accountService } from './account.service.js'
import { createLLMProvider } from '../llm/registry.js'
import { gameService } from './game.service.js'
import { schedulerService } from './scheduler.service.js'
import { settingsService } from './settings.service.js'
import { XP_REWARDS } from '@socialscience/shared'

export const postService = {
  async listPosts(userId: string, accountId?: string, status?: string) {
    const userAccounts = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, userId))
    const accountIds = userAccounts.map((a) => a.id)
    if (accountIds.length === 0) return []

    const filtered = accountId ? [accountId] : accountIds
    const query = db.select().from(posts).where(inArray(posts.accountId, filtered))
    if (status) {
      return db
        .select()
        .from(posts)
        .where(and(inArray(posts.accountId, filtered), eq(posts.status, status)))
        .orderBy(posts.createdAt)
    }
    return query.orderBy(posts.createdAt)
  },

  async getPost(userId: string, postId: string) {
    const [post] = await db
      .select()
      .from(posts)
      .innerJoin(accounts, eq(posts.accountId, accounts.id))
      .where(and(eq(posts.id, postId), eq(accounts.userId, userId)))
      .limit(1)
    if (!post) {
      const err = new Error('Post not found') as Error & { status: number; code: string }
      err.status = 404
      err.code = 'POST_NOT_FOUND'
      throw err
    }
    return post.posts
  },

  /**
   * AI suggestion only — does not create a post row. Client saves via createPost when ready.
   */
  async previewAiPost(userId: string, accountId: string, contextHint?: string, augmentDraft?: string) {
    const account = await accountService.getAccount(userId, accountId)
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.accountId, accountId))
      .limit(1)

    if (!strategy) {
      const err = new Error('No strategy configured for this account') as Error & { status: number; code: string }
      err.status = 400
      err.code = 'NO_STRATEGY'
      throw err
    }

    if (!strategy.llmEnabled) {
      const err = new Error(
        'AI drafting is turned off for this account. Enable it under Strategy, or compose manually.',
      ) as Error & { status: number; code: string }
      err.status = 400
      err.code = 'LLM_DISABLED'
      throw err
    }

    const hasKey = await settingsService.hasLlmApiKey(userId, strategy.llmProvider)
    if (!hasKey) {
      const err = new Error(
        'No LLM API key configured. Add one in Settings to use AI in the composer.',
      ) as Error & { status: number; code: string }
      err.status = 400
      err.code = 'NO_LLM_KEY'
      throw err
    }

    const recentPosts = await db
      .select({ content: posts.content })
      .from(posts)
      .where(and(eq(posts.accountId, accountId), inArray(posts.status, ['published', 'queued'])))
      .orderBy(posts.createdAt)
      .limit(5)

    const llmConfig = await settingsService.resolveLlmConfig(userId, strategy.llmProvider, strategy.llmModel)
    const provider = createLLMProvider(llmConfig.provider, {
      model: llmConfig.model,
      apiKey: llmConfig.apiKey,
    })

    const adapter = createPlatformAdapter(account.platform)
    const baseInput = {
      niche: strategy.niche,
      tone: strategy.tone,
      personaPrompt: strategy.personaPrompt,
      maxLength: adapter.getMaxPostLength(),
      recentPosts: recentPosts.map((p) => p.content),
      context: contextHint,
    }

    const trimmedAugment = augmentDraft?.trim()
    const result = trimmedAugment
      ? await provider.augmentPost(trimmedAugment, baseInput)
      : await provider.generatePost(baseInput)

    return {
      content: result.content,
      provider: result.provider,
      model: result.model,
    }
  },

  async createPost(userId: string, accountId: string, content: string, scheduledFor?: string) {
    await accountService.getAccount(userId, accountId)
    const status = scheduledFor ? 'scheduled' : 'draft'
    const [post] = await db
      .insert(posts)
      .values({
        accountId,
        content,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      })
      .returning()
    return post!
  },

  async updatePost(userId: string, postId: string, updates: { content?: string; status?: string; scheduledFor?: string | null }) {
    const post = await this.getPost(userId, postId)
    const [updated] = await db
      .update(posts)
      .set({
        ...(updates.content !== undefined ? { content: updates.content } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        ...(updates.scheduledFor !== undefined
          ? { scheduledFor: updates.scheduledFor ? new Date(updates.scheduledFor) : null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, post.id))
      .returning()
    return updated!
  },

  async deletePost(userId: string, postId: string) {
    const post = await this.getPost(userId, postId)
    await db.delete(posts).where(eq(posts.id, post.id))
  },

  async publishPost(userId: string, postId: string) {
    const post = await this.getPost(userId, postId)
    const [accountRow] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, post.accountId))
      .limit(1)
    if (!accountRow) throw new Error('Account not found')

    const adapter = await accountService.getAuthenticatedAdapter(accountRow)
    const published = await adapter.createPost({ content: post.content })

    const [updated] = await db
      .update(posts)
      .set({
        status: 'published',
        platformPostId: published.platformPostId,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, post.id))
      .returning()

    await gameService.awardXp(post.accountId, 'post_published', XP_REWARDS.POST_PUBLISHED, { postId: post.id })
    await gameService.updateStreak(post.accountId)

    return updated!
  },

  async schedulePost(userId: string, postId: string, scheduledFor: string) {
    const post = await this.getPost(userId, postId)
    const scheduledDate = new Date(scheduledFor)

    const [updated] = await db
      .update(posts)
      .set({ status: 'scheduled', scheduledFor: scheduledDate, updatedAt: new Date() })
      .where(eq(posts.id, post.id))
      .returning()

    await schedulerService.schedulePost(post.id, post.accountId, scheduledDate)
    return updated!
  },
}

// Needed for circular dep resolution
import { createPlatformAdapter } from '../platforms/registry.js'
