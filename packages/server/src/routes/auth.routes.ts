import { Router } from 'express'
import { authService } from '../services/auth.service.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { loginSchema, registerSchema } from '@socialscience/shared'

const router = Router()

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body as { email: string; password: string; displayName?: string }
    const user = await authService.register(email, password, displayName)
    const { token } = await authService.login(email, password)
    res.status(201).json({ data: { token, user: { id: user.id, email: user.email, displayName: user.displayName } } })
  } catch (err) {
    next(err)
  }
})

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    const { token, user } = await authService.login(email, password)
    res.json({ data: { token, user: { id: user.id, email: user.email, displayName: user.displayName } } })
  } catch (err) {
    next(err)
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getUser(req.userId!)
    res.json({ data: { id: user.id, email: user.email, displayName: user.displayName } })
  } catch (err) {
    next(err)
  }
})

export default router
