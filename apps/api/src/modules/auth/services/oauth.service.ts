import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { env } from '../../../config/env'
import { AuthProviderFactory, type SupportedAuthProvider } from '../providers/AuthProviderFactory'

export class OAuthService {
  getAuthUrl(provider: SupportedAuthProvider | string, state?: string, redirectUri?: string): string {
    const authProvider = AuthProviderFactory.getProvider(provider)
    return authProvider.getAuthUrl(state, redirectUri)
  }

  async handleCallback(
    provider: SupportedAuthProvider | string,
    code: string,
    redirectUri?: string
  ) {
    const authProvider = AuthProviderFactory.getProvider(provider)
    const { tokens, userProfile } = await authProvider.handleCallback(code, redirectUri)

    const cleanEmail = userProfile.email.toLowerCase().trim()

    // 1. Procura usuário já existente por email ou por conta vinculada
    let isNewUser = false
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { accounts: true },
    })

    if (!user) {
      isNewUser = true
      // 2. Se não existir, cria o novo usuário
      user = await prisma.user.create({
        data: {
          name: userProfile.name || cleanEmail.split('@')[0],
          email: cleanEmail,
        },
        include: { accounts: true },
      })
    }

    // 3. Atualiza ou cria o registro da conta OAuth (Account)
    const expiresAt = tokens.expiresIn ? Math.floor(Date.now() / 1000) + tokens.expiresIn : undefined

    const existingAccount = user.accounts.find(
      (acc) => acc.provider === userProfile.provider && acc.provider_account_id === userProfile.providerAccountId
    )

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          access_token: tokens.accessToken,
          ...(tokens.refreshToken ? { refresh_token: tokens.refreshToken } : {}),
          expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.tokenType,
        },
      })
    } else {
      await prisma.account.create({
        data: {
          user_id: user.id,
          provider: userProfile.provider,
          provider_account_id: userProfile.providerAccountId,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.tokenType,
        },
      })
    }

    // 4. Emite JWT de sessão do Aresta
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    )

    return {
      token,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
      },
      oauth: {
        provider: userProfile.provider,
        scope: tokens.scope,
      },
    }
  }

  async linkDriveAccount(userId: number, provider: string, code: string, redirectUri?: string) {
    const cleanProvider = provider.toLowerCase() === 'onedrive' ? 'microsoft' : provider.toLowerCase()
    const authProvider = AuthProviderFactory.getProvider(cleanProvider)
    const { tokens, userProfile } = await authProvider.handleCallback(code, redirectUri)
    const expiresAt = tokens.expiresIn ? Math.floor(Date.now() / 1000) + tokens.expiresIn : undefined

    const existingAccount = await prisma.account.findFirst({
      where: { user_id: userId, provider: cleanProvider }
    })

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          provider_account_id: userProfile.providerAccountId,
          access_token: tokens.accessToken,
          ...(tokens.refreshToken ? { refresh_token: tokens.refreshToken } : {}),
          expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.tokenType,
        }
      })
    } else {
      await prisma.account.create({
        data: {
          user_id: userId,
          provider: cleanProvider,
          provider_account_id: userProfile.providerAccountId,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: expiresAt,
          scope: tokens.scope,
          token_type: tokens.tokenType,
        }
      })
    }

    return {
      success: true,
      provider: cleanProvider,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn
    }
  }

  async unlinkDriveAccount(userId: number, provider: string) {
    const cleanProvider = provider.toLowerCase() === 'onedrive' ? 'microsoft' : provider.toLowerCase()
    await prisma.account.deleteMany({
      where: { user_id: userId, provider: cleanProvider }
    })
    return { success: true }
  }

  async refreshToken(userId: number, provider: SupportedAuthProvider | string) {
    const cleanProvider = provider.toLowerCase() === 'onedrive' ? 'microsoft' : provider.toLowerCase()
    const account = await prisma.account.findFirst({
      where: { user_id: userId, provider: cleanProvider },
    })

    if (!account) {
      throw new Error(`Nenhuma conta ${provider} vinculada para o usuário ID ${userId}`)
    }

    if (!account.refresh_token) {
      throw new Error(`Conta ${provider} não possui refresh token disponível`)
    }

    const authProvider = AuthProviderFactory.getProvider(cleanProvider)
    const newTokens = await authProvider.refreshAccessToken(account.refresh_token)

    const expiresAt = newTokens.expiresIn ? Math.floor(Date.now() / 1000) + newTokens.expiresIn : undefined

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: newTokens.accessToken,
        ...(newTokens.refreshToken ? { refresh_token: newTokens.refreshToken } : {}),
        expires_at: expiresAt,
      },
    })

    return {
      accessToken: newTokens.accessToken,
      expiresIn: newTokens.expiresIn,
    }
  }

  async getAccount(userId: number, provider: string) {
    const cleanProvider = provider.toLowerCase() === 'onedrive' ? 'microsoft' : provider.toLowerCase()
    return prisma.account.findFirst({
      where: { user_id: userId, provider: cleanProvider },
      select: {
        id: true,
        provider: true,
        provider_account_id: true,
        expires_at: true,
        scope: true,
        created_at: true,
        updated_at: true,
      },
    })
  }
}

export const oauthService = new OAuthService()
