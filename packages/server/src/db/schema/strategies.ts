import { pgTable, uuid, varchar, text, integer, time, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'

export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  niche: varchar('niche', { length: 255 }).notNull(),
  tone: varchar('tone', { length: 100 }).notNull(),
  personaPrompt: text('persona_prompt'),
  postFrequency: integer('post_frequency').default(3).notNull(),
  scheduleStart: time('schedule_start').default('09:00').notNull(),
  scheduleEnd: time('schedule_end').default('21:00').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
  postMode: varchar('post_mode', { length: 20 }).default('queue').notNull(),
  llmProvider: varchar('llm_provider', { length: 50 }),
  llmModel: varchar('llm_model', { length: 100 }),
  engagementRules: jsonb('engagement_rules')
    .$type<{
      autoLike: boolean
      autoReply: boolean
      followBack: boolean
      quotePostTrending: boolean
    }>()
    .default({ autoLike: false, autoReply: false, followBack: false, quotePostTrending: false })
    .notNull(),
  autoPostEnabled: boolean('auto_post_enabled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type DbStrategy = typeof strategies.$inferSelect
export type NewStrategy = typeof strategies.$inferInsert
