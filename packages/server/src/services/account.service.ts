import { eq, and, desc, count } from 'drizzle-orm'
import { db } from '../config/db.js'
import { accounts, gameState, analyticsSnapshots, achievements } from '../db/schema/index.js'
import { encrypt, decrypt } from './crypto.js'
import { createPlatformAdapter } from '../platforms/registry.js'
import { gameService } from './game.service.js'
import { XP_REWARDS } from '@socialscience/shared'

export const accountService = {
  async connectAccount(
    userId: string,
    platform: string,
    handle: string,
    password: string,
    serviceUrl?: string,
  ) {
    // Validate credentials first
    const adapter = createPlatformAdapter(platform)
    await adapter.authenticate({ handle, password, serviceUrl })
    const profile = await adapter.getProfile()

    const { encrypted, iv } = encrypt(password)

    const [account] = await db
      .insert(accounts)
      .values({
        userId,
        platform,
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl ?? null,
        credentialEnc: encrypted,
        credentialIv: iv,
        serviceUrl: serviceUrl ?? null,
      })
      .onConflictDoUpdate({
        target: [accounts.userId, accounts.platform, accounts.handle],
        set: {
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl ?? null,
          credentialEnc: encrypted,
          credentialIv: iv,
          updatedAt: new Date(),
        },
      })
      .returning()

    if (!account) throw new Error('Failed to create account')

    // Initialize game state
    await db
      .insert(gameState)
      .values({ accountId: account.id })
      .onConflictDoNothing()

    // Award connection XP
    await gameService.awardXp(account.id, 'account_connected', XP_REWARDS.ACCOUNT_CONNECTED)

    return { account, profile }
  },

  async listAccounts(userId: string) {
    const rows = await db.select().from(accounts).where(eq(accounts.userId, userId))

    return Promise.all(
      rows.map(async (account) => {
        const [state] = await db.select().from(gameState).where(eq(gameState.accountId, account.id)).limit(1)
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
          ...account,
          summary: {
            level: state?.level ?? 1,
            xp: state?.xp ?? 0,
            streakDays: state?.streakDays ?? 0,
            followers: latest?.followers ?? 0,
            achievementCount: achievementRow?.count ?? 0,
          },
        }
      }),
    )
  },

  async getAccount(userId: string, accountId: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .limit(1)
    if (!account) {
      const err = new Error('Account not found') as Error & { status: number; code: string }
      err.status = 404
      err.code = 'ACCOUNT_NOT_FOUND'
      throw err
    }
    return account
  },

  async deleteAccount(userId: string, accountId: string) {
    await this.getAccount(userId, accountId)
    await db.delete(accounts).where(eq(accounts.id, accountId))
  },

  async getDecryptedCredentials(account: typeof accounts.$inferSelect) {
    const password = decrypt(account.credentialEnc, account.credentialIv)
    return { handle: account.handle, password, serviceUrl: account.serviceUrl ?? undefined }
  },

  async getAuthenticatedAdapter(account: typeof accounts.$inferSelect) {
    const creds = await this.getDecryptedCredentials(account)
    const adapter = createPlatformAdapter(account.platform)
    await adapter.authenticate(creds)
    return adapter
  },
}
