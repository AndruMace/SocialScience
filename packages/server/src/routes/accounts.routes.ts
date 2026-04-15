import { Router } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { connectAccountSchema } from '@socialscience/shared'
import { accountService } from '../services/account.service.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const list = await accountService.listAccounts(req.userId!)
    res.json({ data: list.map(({ credentialEnc: _c, credentialIv: _iv, ...a }) => a) })
  } catch (err) { next(err) }
})

router.post('/', validate(connectAccountSchema), async (req: AuthRequest, res, next) => {
  try {
    const { platform, handle, password, serviceUrl } = req.body as { platform: string; handle: string; password: string; serviceUrl?: string }
    const { account, profile } = await accountService.connectAccount(req.userId!, platform, handle, password, serviceUrl)
    const { credentialEnc: _c, credentialIv: _iv, ...safe } = account
    res.status(201).json({ data: { ...safe, ...profile } })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['id'] as string
    const account = await accountService.getAccount(req.userId!, accountId)
    const { credentialEnc: _c, credentialIv: _iv, ...safe } = account
    res.json({ data: safe })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['id'] as string
    await accountService.deleteAccount(req.userId!, accountId)
    res.status(204).send()
  } catch (err) { next(err) }
})

router.post('/:id/verify', async (req: AuthRequest, res, next) => {
  try {
    const accountId = req.params['id'] as string
    const account = await accountService.getAccount(req.userId!, accountId)
    const adapter = await accountService.getAuthenticatedAdapter(account)
    const profile = await adapter.getProfile()
    res.json({ data: { valid: true, profile } })
  } catch (err) { next(err) }
})

export default router
