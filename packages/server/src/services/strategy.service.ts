import { eq } from 'drizzle-orm'
import { db } from '../config/db.js'
import { strategies } from '../db/schema/index.js'
import type { StrategyInput } from '@socialscience/shared'
import { accountService } from './account.service.js'

export const strategyService = {
  async getStrategy(userId: string, accountId: string) {
    await accountService.getAccount(userId, accountId)
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.accountId, accountId))
      .limit(1)
    return strategy ?? null
  },

  async upsertStrategy(userId: string, accountId: string, input: StrategyInput) {
    await accountService.getAccount(userId, accountId)
    const niche =
      input.llmEnabled ? input.niche.trim() : (input.niche?.trim() || 'Manual posting')
    const tone = input.llmEnabled ? input.tone.trim() : (input.tone?.trim() || 'Manual')
    const row = { ...input, niche, tone }
    const [strategy] = await db
      .insert(strategies)
      .values({ accountId, ...row })
      .onConflictDoUpdate({
        target: strategies.accountId,
        set: { ...row, updatedAt: new Date() },
      })
      .returning()
    return strategy!
  },
}
