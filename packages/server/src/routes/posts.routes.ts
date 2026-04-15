import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware, type AuthRequest } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { postService } from '../services/post.service.js'

const router = Router()
router.use(authMiddleware)

const createPostSchema = z.object({
  accountId: z.string().uuid(),
  content: z.string().min(1).max(500),
  scheduledFor: z.string().datetime().optional(),
})

const updatePostSchema = z.object({
  content: z.string().min(1).max(500).optional(),
  status: z.enum(['draft', 'queued']).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
})

const previewAiSchema = z.object({
  accountId: z.string().uuid(),
  contextHint: z.string().optional(),
  augmentDraft: z.string().max(500).optional(),
})

const scheduleSchema = z.object({
  scheduledFor: z.string().datetime(),
})

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { accountId, status } = req.query as { accountId?: string; status?: string }
    const list = await postService.listPosts(req.userId!, accountId, status)
    res.json({ data: list })
  } catch (err) { next(err) }
})

router.post('/preview', validate(previewAiSchema), async (req: AuthRequest, res, next) => {
  try {
    const { accountId, contextHint, augmentDraft } = req.body as {
      accountId: string
      contextHint?: string
      augmentDraft?: string
    }
    const data = await postService.previewAiPost(req.userId!, accountId, contextHint, augmentDraft)
    res.json({ data })
  } catch (err) { next(err) }
})

router.post('/', validate(createPostSchema), async (req: AuthRequest, res, next) => {
  try {
    const { accountId, content, scheduledFor } = req.body as { accountId: string; content: string; scheduledFor?: string }
    const post = await postService.createPost(req.userId!, accountId, content, scheduledFor)
    res.status(201).json({ data: post })
  } catch (err) { next(err) }
})

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const postId = req.params['id'] as string
    const post = await postService.getPost(req.userId!, postId)
    res.json({ data: post })
  } catch (err) { next(err) }
})

router.patch('/:id', validate(updatePostSchema), async (req: AuthRequest, res, next) => {
  try {
    const postId = req.params['id'] as string
    const post = await postService.updatePost(req.userId!, postId, req.body)
    res.json({ data: post })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const postId = req.params['id'] as string
    await postService.deletePost(req.userId!, postId)
    res.status(204).send()
  } catch (err) { next(err) }
})

router.post('/:id/publish', async (req: AuthRequest, res, next) => {
  try {
    const postId = req.params['id'] as string
    const post = await postService.publishPost(req.userId!, postId)
    res.json({ data: post })
  } catch (err) { next(err) }
})

router.post('/:id/schedule', validate(scheduleSchema), async (req: AuthRequest, res, next) => {
  try {
    const postId = req.params['id'] as string
    const { scheduledFor } = req.body as { scheduledFor: string }
    const post = await postService.schedulePost(req.userId!, postId, scheduledFor)
    res.json({ data: post })
  } catch (err) { next(err) }
})

export default router
