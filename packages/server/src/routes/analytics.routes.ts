import { Router } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js'
import { analyticsService } from '../services/analytics.service.js'
import { gameService } from '../services/game.service.js'
import { schedulerService } from '../services/scheduler.service.js'
import { accountService } from '../services/account.service.js'
import { postService } from '../services/post.service.js'

const router = Router()
router.use(authMiddleware)

router.get('/accounts/:accountId', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    await accountService.getAccount(req.userId!, accountId)
    const { from, to } = req.query as { from?: string; to?: string }
    const data = await analyticsService.getAccountAnalytics(accountId, from, to)
    res.json({ data })
  } catch (err) { next(err) }
})

router.get('/accounts/:accountId/latest', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    await accountService.getAccount(req.userId!, accountId)
    const data = await analyticsService.getLatestSnapshot(accountId)
    res.json({ data })
  } catch (err) { next(err) }
})

router.post('/accounts/:accountId/refresh', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['accountId'] as string
    await accountService.getAccount(req.userId!, accountId)
    await schedulerService.triggerAnalyticsRefresh(accountId)
    res.json({ data: { queued: true } })
  } catch (err) { next(err) }
})

router.get('/posts/:postId', async (req: AuthRequest, res, next) => {
  try {
    const postId = req.params['postId'] as string
    await postService.getPost(req.userId!, postId)
    const data = await analyticsService.getPostAnalytics(postId)
    res.json({ data })
  } catch (err) { next(err) }
})

router.get('/leaderboard', async (req: AuthRequest, res, next) => {
  try {
    const data = await gameService.getLeaderboard(req.userId!)
    res.json({ data })
  } catch (err) { next(err) }
})

export default router
