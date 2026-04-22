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
  platform: z.enum(['bluesky', 'x']),
  handle: z.string().min(1).max(255),
  password: z.string().min(1),
  serviceUrl: z.string().url().optional(),
})
