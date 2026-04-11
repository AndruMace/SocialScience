import { Router } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js'
import { gameService } from '../services/game.service.js'
import { accountService } from '../services/account.service.js'
import { ACHIEVEMENTS } from '@socialscience/shared'

const router = Router()
router.use(authMiddleware)

router.get('/accounts/:accountId', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    await accountService.getAccount(req.userId!, accountId)
    const data = await gameService.getGameState(accountId)
    res.json({ data })
  } catch (err) { next(err) }
})

router.get('/accounts/:accountId/achievements', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    await accountService.getAccount(req.userId!, accountId)
    const data = await gameService.getAchievements(accountId)
    res.json({ data })
  } catch (err) { next(err) }
})

router.get('/accounts/:accountId/xp-history', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    await accountService.getAccount(req.userId!, accountId)
    const data = await gameService.getXpHistory(accountId)
    res.json({ data })
  } catch (err) { next(err) }
})

router.get('/achievements/catalog', async (_req: AuthRequest, res, next) => {
  try {
    res.json({ data: ACHIEVEMENTS })
  } catch (err) { next(err) }
})

export default router
