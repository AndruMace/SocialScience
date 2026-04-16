import { pgTable, uuid, integer, date, timestamp, varchar, text, jsonb, unique, index } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'
import { users } from './users.js'

export const gameState = pgTable('game_state', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  /** XP from gameplay events (posts, engagement, connection bonus, etc.) */
  activityXp: integer('activity_xp').notNull().default(0),
  /** XP from current follower count; see followersToStatureXp in @socialscience/shared */
  followerStatureXp: integer('follower_stature_xp').notNull().default(0),
  /** Cached total = activityXp + followerStatureXp */
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  streakDays: integer('streak_days').default(0).notNull(),
  lastPostDate: date('last_post_date'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const achievements = pgTable(
  'achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    achievementKey: varchar('achievement_key', { length: 100 }).notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.accountId, t.achievementKey), index('idx_achievements_account').on(t.accountId)],
)

export const xpEvents = pgTable(
  'xp_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    xpAmount: integer('xp_amount').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_xp_events_account').on(t.accountId, t.createdAt)],
)

export const appSettings = pgTable(
  'app_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value').notNull(),
  },
  (t) => [unique().on(t.userId, t.key)],
)

export type DbGameState = typeof gameState.$inferSelect
export type DbAchievement = typeof achievements.$inferSelect
export type DbXpEvent = typeof xpEvents.$inferSelect
