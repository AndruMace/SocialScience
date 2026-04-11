import { Router } from 'express'
import authRoutes from './auth.routes.js'
import accountRoutes from './accounts.routes.js'
import strategyRoutes from './strategy.routes.js'
import postRoutes from './posts.routes.js'
import analyticsRoutes from './analytics.routes.js'
import gameRoutes from './game.routes.js'
import settingsRoutes from './settings.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/accounts', accountRoutes)
router.use('/accounts/:accountId/strategy', strategyRoutes)
router.use('/posts', postRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/game', gameRoutes)
router.use('/settings', settingsRoutes)

export default router
