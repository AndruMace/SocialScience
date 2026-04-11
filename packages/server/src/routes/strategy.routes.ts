import { Router } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { strategySchema } from '@socialscience/shared'
import { strategyService } from '../services/strategy.service.js'

const router = Router({ mergeParams: true })
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    const strategy = await strategyService.getStrategy(req.userId!, accountId)
    res.json({ data: strategy })
  } catch (err) { next(err) }
})

router.put('/', validate(strategySchema), async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    const strategy = await strategyService.upsertStrategy(req.userId!, accountId, req.body)
    res.json({ data: strategy })
  } catch (err) { next(err) }
})

export default router
