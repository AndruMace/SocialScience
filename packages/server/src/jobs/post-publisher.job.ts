import { eq } from 'drizzle-orm'
import { db } from '../config/db.js'
import { posts, accounts } from '../db/schema/index.js'
import { accountService } from '../services/account.service.js'
import { gameService } from '../services/game.service.js'

interface PublishPostJob {
  postId: string
  accountId: string
}

export async function handlePublishPost({ postId, accountId }: PublishPostJob) {

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post || post.status !== 'scheduled') return

  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1)
  if (!account) throw new Error(`Account ${accountId} not found`)

  try {
    const adapter = await accountService.getAuthenticatedAdapter(account)
    const published = await adapter.createPost({ content: post.content })

    await db
      .update(posts)
      .set({
        status: 'published',
        platformPostId: published.platformPostId,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))

    await gameService.awardXp(accountId, 'post_published', 25, { postId })
    await gameService.updateStreak(accountId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(posts)
      .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
      .where(eq(posts.id, postId))
    throw err
  }
}
