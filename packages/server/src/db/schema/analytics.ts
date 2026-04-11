import { pgTable, uuid, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'
import { posts } from './posts.js'

export const analyticsSnapshots = pgTable(
  'analytics_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
    followers: integer('followers').default(0).notNull(),
    following: integer('following').default(0).notNull(),
    totalPosts: integer('total_posts').default(0).notNull(),
    likesReceived: integer('likes_received').default(0).notNull(),
    repostsReceived: integer('reposts_received').default(0).notNull(),
    repliesReceived: integer('replies_received').default(0).notNull(),
  },
  (t) => [index('idx_analytics_account_time').on(t.accountId, t.capturedAt)],
)

export const postAnalytics = pgTable('post_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
  likes: integer('likes').default(0).notNull(),
  reposts: integer('reposts').default(0).notNull(),
  replies: integer('replies').default(0).notNull(),
  impressions: integer('impressions').default(0).notNull(),
})

export type DbAnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect
export type DbPostAnalytics = typeof postAnalytics.$inferSelect
