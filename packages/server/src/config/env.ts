import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../../../../.env') })

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required environment variable: ${key}`)
  return val
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  ENCRYPTION_KEY: required('ENCRYPTION_KEY'),
  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY', ''),
  OPENAI_API_KEY: optional('OPENAI_API_KEY', ''),
  PORT: parseInt(optional('PORT', '3001'), 10),
  NODE_ENV: optional('NODE_ENV', 'development'),
}
