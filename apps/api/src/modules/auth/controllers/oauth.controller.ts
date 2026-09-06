import type { Request, Response } from 'express'
import { oauthService } from '../services/oauth.service'

export class OAuthController {
  async getUrl(req: Request, res: Response): Promise<void> {
    try {
      const provider = String(req.params.provider)
      const state = typeof req.query.state === 'string' ? req.query.state : undefined
      const redirectUri = typeof req.query.redirectUri === 'string' ? req.query.redirectUri : undefined

      const url = oauthService.getAuthUrl(provider, state, redirectUri)
      res.json({ url })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async callback(req: Request, res: Response): Promise<void> {
    try {
      const provider = String(req.params.provider)
      const { code, redirectUri } = req.body

      if (!code) {
        res.status(400).json({ error: 'Parâmetro "code" é obrigatório no corpo da requisição' })
        return
      }

      const result = await oauthService.handleCallback(provider, code, redirectUri)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const provider = String(req.params.provider)
      const userId = (req as any).user?.userId

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' })
        return
      }

      const result = await oauthService.refreshToken(userId, provider)
      res.json(result)
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const provider = String(req.params.provider)
      const userId = (req as any).user?.userId

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' })
        return
      }

      const account = await oauthService.getAccount(userId, provider)
      res.json({
        linked: !!account,
        account: account
          ? {
              provider: account.provider,
              scope: account.scope,
              expiresAt: account.expires_at,
              updatedAt: account.updated_at,
            }
          : null,
      })
    } catch (err: any) {
      res.status(400).json({ error: err.message })
    }
  }
}

export const oauthController = new OAuthController()
