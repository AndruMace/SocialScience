import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface AuthRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ status: 401, code: 'UNAUTHORIZED', message: 'No token provided' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ status: 401, code: 'INVALID_TOKEN', message: 'Invalid or expired token' })
  }
}
