import { pgTable, uuid, varchar, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: varchar('platform', { length: 50 }).notNull(),
    handle: varchar('handle', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    credentialEnc: text('credential_enc').notNull(),
    credentialIv: varchar('credential_iv', { length: 64 }).notNull(),
    serviceUrl: varchar('service_url', { length: 255 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.platform, t.handle)],
)

export type DbAccount = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
