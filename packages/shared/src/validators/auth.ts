import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
})

export const connectAccountSchema = z.object({
  platform: z.enum(['bluesky']),
  handle: z.string().min(1).max(255),
  password: z.string().min(1),
  serviceUrl: z.string().url().optional(),
})

/** Create a new Bluesky (ATProto) account via com.atproto.server.createAccount — no separate Bluesky visit required. */
export const registerBlueskyAccountSchema = z.object({
  handle: z.string().min(1).max(255),
  password: z.string().min(8).max(1024),
  /** Required for bsky.social: verification, recovery, and typical posting flows. */
  email: z.string().email(),
  inviteCode: z.string().min(1).max(255).optional(),
  verificationCode: z.string().min(1).max(64).optional(),
  serviceUrl: z.string().url().optional(),
})
