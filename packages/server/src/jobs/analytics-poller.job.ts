import { eq } from 'drizzle-orm'
import { db } from '../config/db.js'
import { accounts } from '../db/schema/index.js'
import { analyticsService } from '../services/analytics.service.js'

export async function handleAnalyticsPoll({ accountId }: { accountId?: string }) {

  if (accountId) {
    await analyticsService.pollAccount(accountId)
    return
  }

  // Poll all active accounts
  const activeAccounts = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.isActive, true))

  await Promise.allSettled(activeAccounts.map((a) => analyticsService.pollAccount(a.id)))
}
