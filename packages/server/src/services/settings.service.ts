import { eq } from 'drizzle-orm'
import { db } from '../config/db.js'
import { appSettings } from '../db/schema/index.js'
import { decrypt, encrypt } from './crypto.js'
import { env } from '../config/env.js'

const SENSITIVE_PREFIX = 'enc:'
const SENSITIVE_KEYS = new Set(['anthropic_api_key', 'openai_api_key'])

function encodeValue(key: string, value: string): string {
  if (!SENSITIVE_KEYS.has(key) || value === '') return value
  const { encrypted, iv } = encrypt(value)
  return `${SENSITIVE_PREFIX}${iv}:${encrypted}`
}

function decodeValue(key: string, value: string): string {
  if (!SENSITIVE_KEYS.has(key) || !value.startsWith(SENSITIVE_PREFIX)) return value
  const payload = value.slice(SENSITIVE_PREFIX.length)
  const [iv, encrypted] = payload.split(':')
  if (!iv || !encrypted) return value
  return decrypt(encrypted, iv)
}

function getProviderApiKey(provider: string, settings: Record<string, string>): string {
  if (provider === 'claude') return settings['anthropic_api_key'] || env.ANTHROPIC_API_KEY
  if (provider === 'openai') return settings['openai_api_key'] || env.OPENAI_API_KEY
  return ''
}

export const settingsService = {
  async getUserSettings(userId: string): Promise<Record<string, string>> {
    const rows = await db.select().from(appSettings).where(eq(appSettings.userId, userId))
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = decodeValue(row.key, row.value)
    }
    return settings
  },

  async saveUserSettings(userId: string, input: Record<string, string>): Promise<number> {
    const entries = Object.entries(input)
    for (const [key, value] of entries) {
      await db
        .insert(appSettings)
        .values({ userId, key, value: encodeValue(key, value) })
        .onConflictDoUpdate({
          target: [appSettings.userId, appSettings.key],
          set: { value: encodeValue(key, value) },
        })
    }
    return entries.length
  },

  async resolveLlmConfig(userId: string, providerOverride?: string | null, modelOverride?: string | null) {
    const settings = await this.getUserSettings(userId)
    const provider = providerOverride ?? settings['default_llm_provider'] ?? 'claude'
    return {
      provider,
      model: modelOverride ?? null,
      apiKey: getProviderApiKey(provider, settings),
      settings,
    }
  },
}
