import type { Request, Response, NextFunction } from 'express'

export function errorMiddleware(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err)
  const status = err.status ?? 500
  res.status(status).json({
    status,
    code: err.code ?? 'INTERNAL_ERROR',
    message: err.message ?? 'An unexpected error occurred',
  })
}
