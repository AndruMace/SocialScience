import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../config/db.js'
import { users } from '../db/schema/index.js'
import { env } from '../config/env.js'

const SALT_ROUNDS = 12
/** Shown in login UI when session expires; keep in sync with client copy if you change this. */
const JWT_EXPIRY = '30d'

export const authService = {
  async register(email: string, password: string, displayName?: string) {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) {
      const err = new Error('Email already registered') as Error & { status: number; code: string }
      err.status = 409
      err.code = 'EMAIL_EXISTS'
      throw err
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, displayName })
      .returning()
    return user!
  },

  async login(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) {
      const err = new Error('Invalid credentials') as Error & { status: number; code: string }
      err.status = 401
      err.code = 'INVALID_CREDENTIALS'
      throw err
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      const err = new Error('Invalid credentials') as Error & { status: number; code: string }
      err.status = 401
      err.code = 'INVALID_CREDENTIALS'
      throw err
    }
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: JWT_EXPIRY })
    return { token, user }
  },

  async getUser(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      const err = new Error('User not found') as Error & { status: number; code: string }
      err.status = 404
      err.code = 'USER_NOT_FOUND'
      throw err
    }
    return user
  },
}
