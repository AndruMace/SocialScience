import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import type { Request, Response } from 'express'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import { schedulerService } from './services/scheduler.service.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }))
app.use('/api/v1', routes)
app.use(errorMiddleware)

app.listen(env.PORT, () => {
  console.log(`✓ Server running on http://localhost:${env.PORT}`)
  schedulerService.initialize().catch(console.error)
})
