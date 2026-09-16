import { Router, type Request, type Response } from 'express'

export const createGoneRouter = (resourceName: string): Router => {
  const router = Router()
  const handler = (_req: Request, res: Response) => {
    res.status(410).json({
      statusCode: 410,
      error: 'Gone',
      resource: resourceName,
      message: `O recurso de ${resourceName} foi descontinuado no backend. O Aresta agora opera exclusivamente em modo Local-First sincronizado com o seu Drive pessoal.`
    })
  }
  router.all('*', handler)
  return router
}
