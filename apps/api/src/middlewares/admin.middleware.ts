import type { Request, Response, NextFunction } from 'express'

/**
 * Middleware de autorização: requer que o usuário autenticado tenha role ADMIN.
 * Deve ser usado sempre APÓS o middleware `authenticate`.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admin access required' })
    return
  }

  next()
}
