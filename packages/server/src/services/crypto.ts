import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { env } from '../config/env.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey(): Buffer {
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex')
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte (64 hex char) string')
  }
  return key
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const combined = Buffer.concat([authTag, encrypted])
  return {
    encrypted: combined.toString('hex'),
    iv: iv.toString('hex'),
  }
}

export function decrypt(encryptedHex: string, ivHex: string): string {
  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const combined = Buffer.from(encryptedHex, 'hex')
  const authTag = combined.subarray(0, 16)
  const encrypted = combined.subarray(16)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
