import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { env } from '../../../config/env'
import type { RegisterDto, LoginDto } from '../schemas/auth.schema'

import { AuthProviderFactory } from '../providers/AuthProviderFactory'

export class AuthService {
  async register(data: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new Error('Email already registered')

    const password_hash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password_hash },
      select: { id: true, name: true, email: true, role: true, is_active: true },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    )

    return { token, isNewUser: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.is_active } }
  }

  async login(data: LoginDto) {
    const identifier = (data.email || data.login || '').trim()
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { name: identifier }
        ]
      }
    })
    if (!user || !user.password_hash) throw new Error('Invalid credentials')

    const valid = await bcrypt.compare(data.password, user.password_hash)
    if (!valid) throw new Error('Invalid credentials')

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    )
    return { token, isNewUser: false, user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.is_active } }
  }

  async deleteAccount(userId: number) {
    // 1. Limpa os arquivos e pastas da conta no Google Drive e OneDrive se houver contas conectadas
    try {
      const accounts = await prisma.account.findMany({ where: { user_id: userId } })
      for (const account of accounts) {
        if (account.provider === 'google') {
          try {
            let token = account.access_token
            if (account.refresh_token) {
              const googleProvider = AuthProviderFactory.getProvider('google')
              const refreshed = await googleProvider.refreshAccessToken(account.refresh_token)
              token = refreshed.accessToken
            }
            if (token) {
              const query = `name = 'Aresta' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
              const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
              const searchRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
              if (searchRes.ok) {
                const searchData = (await searchRes.json()) as { files?: Array<{ id: string }> }
                if (searchData.files && searchData.files.length > 0) {
                  for (const f of searchData.files) {
                    await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` }
                    })
                  }
                }
              }
            }
          } catch (gErr) {
            console.warn('[AuthService] Falha ao excluir arquivos do Google Drive na exclusão de conta:', gErr)
          }
        } else if (account.provider === 'microsoft') {
          try {
            let token = account.access_token
            if (account.refresh_token) {
              const msProvider = AuthProviderFactory.getProvider('microsoft')
              const refreshed = await msProvider.refreshAccessToken(account.refresh_token)
              token = refreshed.accessToken
            }
            if (token) {
              await fetch('https://graph.microsoft.com/v1.0/me/drive/root:/Aresta', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              })
            }
          } catch (msErr) {
            console.warn('[AuthService] Falha ao excluir arquivos do OneDrive na exclusão de conta:', msErr)
          }
        }
      }
    } catch (cleanErr) {
      console.warn('[AuthService] Erro ao buscar contas vinculadas para limpeza na nuvem:', cleanErr)
    }

    // 2. Deleta o usuário do banco de dados (em cascata para accounts, feedbacks, etc.)
    await prisma.user.delete({ where: { id: userId } })
    return { success: true }
  }
}

export const authService = new AuthService()
