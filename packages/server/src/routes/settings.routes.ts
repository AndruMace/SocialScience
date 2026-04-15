import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { getAvailableProviders, createLLMProvider } from '../llm/registry.js'
import { settingsService } from '../services/settings.service.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const settings = await settingsService.getUserSettings(req.userId!)
    res.json({ data: settings })
  } catch (err) { next(err) }
})

router.put('/', validate(z.record(z.string())), async (req: AuthRequest, res, next) => {
  try {
    const updated = await settingsService.saveUserSettings(req.userId!, req.body as Record<string, string>)
    res.json({ data: { updated } })
  } catch (err) { next(err) }
})

router.get('/llm/providers', (_req, res) => {
  res.json({ data: getAvailableProviders() })
})

router.get('/llm/availability', async (req: AuthRequest, res, next) => {
  try {
    const connected = await settingsService.hasUserLlmApiKey(req.userId!)
    res.json({ data: { connected } })
  } catch (err) {
    next(err)
  }
})

router.post(
  '/llm/test',
  validate(
    z.object({
      provider: z.string(),
      model: z.string().optional(),
      /** When set, used for this test only (e.g. unsaved value from the UI). Otherwise saved settings / env. */
      apiKey: z.string().optional(),
    }),
  ),
  async (req: AuthRequest, res) => {
    try {
      const { provider, model, apiKey: apiKeyFromBody } = req.body as {
        provider: string
        model?: string
        apiKey?: string
      }
      const llmConfig = await settingsService.resolveLlmConfig(req.userId!, provider, model)
      const apiKey = (apiKeyFromBody?.trim() || llmConfig.apiKey?.trim()) ?? ''
      if (!apiKey) {
        res.json({
          data: {
            ok: false,
            error: `No API key for "${provider}". Paste a key in the matching field (or save a stored key), with Default provider set to that provider.`,
          },
        })
        return
      }
      const llm = createLLMProvider(provider, { model: llmConfig.model, apiKey })
      await llm.testConnection()
      res.json({ data: { ok: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed'
      res.json({ data: { ok: false, error: message } })
    }
  },
)

export default router
