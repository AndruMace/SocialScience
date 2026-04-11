import { pgTable, uuid, text, varchar, timestamp, index } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    platformPostId: varchar('platform_post_id', { length: 255 }),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    llmProvider: varchar('llm_provider', { length: 50 }),
    llmModel: varchar('llm_model', { length: 100 }),
    generationPrompt: text('generation_prompt'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_posts_account_status').on(t.accountId, t.status),
    index('idx_posts_scheduled').on(t.status, t.scheduledFor),
  ],
)

export type DbPost = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
